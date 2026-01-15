// Firebase Config - Skrinshotingizdan olindi
const firebaseConfig = {
    apiKey: "AIzaSyD_AaQCbi4ipNXkzqRwq9BxQirC1rp-yC0",
    authDomain: "shashka-online.firebaseapp.com",
    projectId: "shashka-online",
    storageBucket: "shashka-online.firebasestorage.app",
    messagingSenderId: "1097808487424",
    appId: "1:1097808487424:web:02d79c42b15a09c93724e5",
    measurementId: "G-WKDZXDQ3QH"
  };
  
  // Firebase-ni ishga tushirish (Compatibility mode)
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  
  // O'yinchi ma'lumotlarini olish yoki yaratish
  async function getPlayerProfile(uid, name) {
      const userRef = db.collection("players").doc(uid);
      const doc = await userRef.get();
      
      if (!doc.exists) {
          const newProfile = { name: name, points: 1000, gamesPlayed: 0 };
          await userRef.set(newProfile);
          return newProfile;
      }
      return doc.data();
  }
  
  // Ballarni yangilash (+25/+45 yoki -15/-30)
  async function updatePoints(uid, isWinner) {
      const userRef = db.collection("players").doc(uid);
      let change = isWinner ? 
          Math.floor(Math.random() * 21) + 25 : 
          -(Math.floor(Math.random() * 16) + 15);
  
      await userRef.update({
          points: firebase.firestore.FieldValue.increment(change),
          gamesPlayed: firebase.firestore.FieldValue.increment(1)
      });
  
      // 10-o'yin bonusi (+250 ball)
      const doc = await userRef.get();
      if (doc.data().gamesPlayed % 10 === 0) {
          await userRef.update({ points: firebase.firestore.FieldValue.increment(250) });
          alert("Tabriklaymiz! 10-o'yin uchun +250 bonus ball berildi!");
      }
  }