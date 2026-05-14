package com.gamebuddy.repository;

import com.gamebuddy.entity.Friendship;
import com.gamebuddy.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    // Kullanıcıya gelen bekleyen istekler
    List<Friendship> findByUser2AndStatus(User user2, String status);

    // Kullanıcının gönderdiği bekleyen istekler
    List<Friendship> findByUser1AndStatus(User user1, String status);

    // İki kullanıcı arasındaki arkadaşlık kaydını bul (her iki yönde)
    Optional<Friendship> findByUser1AndUser2(User user1, User user2);

    @Modifying
    @Query("DELETE FROM Friendship f WHERE (f.user1.id = :u1Id AND f.user2.id = :u2Id) OR (f.user1.id = :u2Id AND f.user2.id = :u1Id)")
    void deleteRelationship(@Param("u1Id") Long u1Id, @Param("u2Id") Long u2Id);

    // İki kullanıcı arasında herhangi bir durumda kayıt var mı?
    boolean existsByUser1AndUser2(User user1, User user2);
}
