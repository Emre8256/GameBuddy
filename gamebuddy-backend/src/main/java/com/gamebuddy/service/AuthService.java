package com.gamebuddy.service;

import com.gamebuddy.dto.AuthResponse;
import com.gamebuddy.dto.LoginRequest;
import com.gamebuddy.dto.RegisterRequest;
import com.gamebuddy.entity.Profile;
import com.gamebuddy.entity.User;
import com.gamebuddy.exception.InvalidCredentialsException;
import com.gamebuddy.exception.UserAlreadyExistsException;
import com.gamebuddy.repository.UserRepository;
import com.gamebuddy.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new UserAlreadyExistsException("Email is already in use");
        }
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new UserAlreadyExistsException("Username is already in use");
        }

        User user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        // Profil oluştur ve kullanıcıya bağla
        Profile profile = Profile.builder()
                .user(user)
                .bio(request.getBio())
                .avatarUrl(request.getAvatarUrl())
                .favoriteGames(request.getFavoriteGames())
                .lookingForGroup(true) // Varsayılan olarak takım arkadaşı arıyor
                .build();
        
        user.setProfile(profile);

        userRepository.save(user);

        org.springframework.security.core.userdetails.User userDetails = 
            new org.springframework.security.core.userdetails.User(user.getEmail(), user.getPasswordHash(), new ArrayList<>());
        
        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (AuthenticationException e) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        org.springframework.security.core.userdetails.User userDetails = 
            new org.springframework.security.core.userdetails.User(user.getEmail(), user.getPasswordHash(), new ArrayList<>());

        String token = jwtUtil.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .build();
    }
}
