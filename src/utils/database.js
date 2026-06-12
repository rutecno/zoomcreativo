import { isFirebaseConfigured, auth, db, storage } from "./firebase";
import { HISTORICO_GANADORES } from "./historicoData";
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  addDoc, query, where, orderBy, limit 
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";

// --- SEED INITIAL LOCALSTORAGE DATA ---
const seedMockDatabase = () => {
  if (!localStorage.getItem("zc_users")) {
    const defaultUsers = [
      {
        email: "admin@zoomcreativo.com",
        document: "ADMIN123",
        name: "Ronaldo Urdaneta",
        instagram: "zoomcreativo.ok",
        avatar: "",
        bio: "Administrador oficial del grupo de fotografía Zoom Creativo.",
        role: "admin"
      },
      {
        email: "carlos@gmail.com",
        document: "1098765432",
        name: "Carlos Mendoza",
        instagram: "carlos_mza_photo",
        avatar: "",
        bio: "Entusiasta de la fotografía móvil. Me encanta capturar reflejos y retratos urbanos.",
        role: "user"
      },
      {
        email: "sofia@gmail.com",
        document: "1234567890",
        name: "Sofía Rojas",
        instagram: "sofi_rojas_lens",
        avatar: "",
        bio: "Apasionada por la luz natural y los colores cálidos. Miembro de Zoom Creativo desde 2026.",
        role: "user"
      }
    ];
    localStorage.setItem("zc_users", JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem("zc_challenges")) {
    const today = new Date().toISOString().split("T")[0];
    const defaultChallenges = [
      {
        id: "c_today",
        date: today,
        theme: "Sombras en la Ciudad",
        description: "Captura el juego dramático de luces y sombras que genera la arquitectura urbana o la luz solar de la tarde. Busca contrastes marcados y siluetas sugerentes.",
        status: "active",
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem("zc_challenges", JSON.stringify(defaultChallenges));
  }

  if (!localStorage.getItem("zc_submissions")) {
    const today = new Date().toISOString().split("T")[0];
    // Seed 3 mock submissions for today's challenge so the admin can test immediately!
    const defaultSubmissions = [
      {
        id: "sub_1",
        challengeId: "c_today",
        userEmail: "carlos@gmail.com",
        userName: "Carlos Mendoza",
        photoUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800", // shadow photo
        caption: "Diagonal de sombra proyectada por un edificio moderno a mitad del día.",
        techniques: ["Alineación con cuadrícula", "Exposición bloqueada en las luces altas"],
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isWinner: false,
        adminFeedback: null
      },
      {
        id: "sub_2",
        challengeId: "c_today",
        userEmail: "sofia@gmail.com",
        userName: "Sofía Rojas",
        photoUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800", // setup/lighting photo
        caption: "Contraste fuerte entre el humo del café caliente y la luz dura de la ventana.",
        techniques: ["Luz lateral", "Enfoque selectivo", "Macro móvil"],
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        isWinner: false,
        adminFeedback: null
      }
    ];
    localStorage.setItem("zc_submissions", JSON.stringify(defaultSubmissions));
  }

  if (!localStorage.getItem("zc_notifications")) {
    const defaultNotifications = [
      {
        id: "n_welcome",
        recipientEmail: "carlos@gmail.com",
        title: "¡Bienvenido a Zoom Creativo!",
        message: "Ya puedes participar en el reto diario de fotografía móvil. ¡Disfruta capturando!",
        isRead: false,
        timestamp: new Date().toISOString()
      }
    ];
    localStorage.setItem("zc_notifications", JSON.stringify(defaultNotifications));
  }
};

// Execute seeding if in mock mode
if (!isFirebaseConfigured) {
  seedMockDatabase();
}

// --- HELPER WRAPPER FUNCTIONS (FIREBASE / LOCALSTORAGE HYBRID) ---

// Current User State for Auth Simulation in Mock Mode
let currentMockUser = null;

export const database = {
  // 1. AUTH & USER FUNCTIONS
  login: async (email, document) => {
    if (isFirebaseConfigured) {
      // For Firebase, we'll log in using Email. We can use document aspassword or standard password.
      // Since the user asked for register with email and document, we will map document to password in Firebase Auth!
      const userCredential = await signInWithEmailAndPassword(auth, email, document);
      const userDoc = await getDoc(doc(db, "users", email));
      return userDoc.exists() ? userDoc.data() : { email, role: "user" };
    } else {
      const users = JSON.parse(localStorage.getItem("zc_users") || "[]");
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.document === document);
      if (!user) {
        throw new Error("Credenciales inválidas. Verifica tu correo y documento.");
      }
      currentMockUser = user;
      localStorage.setItem("zc_current_user", JSON.stringify(user));
      return user;
    }
  },

  register: async (name, email, document, instagram, bio = "", avatar = "") => {
    if (isFirebaseConfigured) {
      // Register in Firebase Auth (using document as password)
      await createUserWithEmailAndPassword(auth, email, document);
      const userData = {
        name,
        email,
        document,
        instagram,
        bio,
        avatar,
        role: "user",
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "users", email), userData);
      return userData;
    } else {
      const users = JSON.parse(localStorage.getItem("zc_users") || "[]");
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("El correo ya se encuentra registrado.");
      }
      const newUser = { name, email, document, instagram, bio, avatar, role: "user" };
      users.push(newUser);
      localStorage.setItem("zc_users", JSON.stringify(users));
      
      // Auto-notify new user
      const notifs = JSON.parse(localStorage.getItem("zc_notifications") || "[]");
      notifs.push({
        id: "n_" + Date.now(),
        recipientEmail: email,
        title: "¡Registro exitoso!",
        message: "Bienvenido a la comunidad Zoom Creativo. Sube tus fotos y participa en los retos.",
        isRead: false,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem("zc_notifications", JSON.stringify(notifs));
      
      return newUser;
    }
  },

  getCurrentUser: () => {
    if (isFirebaseConfigured) {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return null;
      // In real deployment, React app will listen to state, but we return a getter
      return null; // Will hook inside App.jsx
    } else {
      if (!currentMockUser) {
        const stored = localStorage.getItem("zc_current_user");
        if (stored) currentMockUser = JSON.parse(stored);
      }
      return currentMockUser;
    }
  },

  logout: async () => {
    if (isFirebaseConfigured) {
      await signOut(auth);
    } else {
      currentMockUser = null;
      localStorage.removeItem("zc_current_user");
    }
  },

  getUsers: async () => {
    if (isFirebaseConfigured) {
      const querySnapshot = await getDocs(collection(db, "users"));
      return querySnapshot.docs.map(doc => doc.data());
    } else {
      return JSON.parse(localStorage.getItem("zc_users") || "[]");
    }
  },

  updateUserProfile: async (email, updatedData) => {
    if (isFirebaseConfigured) {
      const userRef = doc(db, "users", email);
      await updateDoc(userRef, updatedData);
      return { email, ...updatedData };
    } else {
      const users = JSON.parse(localStorage.getItem("zc_users") || "[]");
      const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (index !== -1) {
        users[index] = { ...users[index], ...updatedData };
        localStorage.setItem("zc_users", JSON.stringify(users));
        if (currentMockUser && currentMockUser.email.toLowerCase() === email.toLowerCase()) {
          currentMockUser = users[index];
          localStorage.setItem("zc_current_user", JSON.stringify(currentMockUser));
        }
      }
      return users[index];
    }
  },

  // 2. CHALLENGES
  getChallenges: async () => {
    if (isFirebaseConfigured) {
      const querySnapshot = await getDocs(query(collection(db, "challenges"), orderBy("createdAt", "desc")));
      return querySnapshot.docs.map(doc => doc.data());
    } else {
      return JSON.parse(localStorage.getItem("zc_challenges") || "[]");
    }
  },

  getCurrentChallenge: async () => {
    if (isFirebaseConfigured) {
      const q = query(collection(db, "challenges"), where("status", "==", "active"), limit(1));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data();
      }
      return null;
    } else {
      const challenges = JSON.parse(localStorage.getItem("zc_challenges") || "[]");
      return challenges.find(c => c.status === "active") || null;
    }
  },

  createChallenge: async (theme, description) => {
    const today = new Date().toISOString().split("T")[0];
    const newChallenge = {
      id: "c_" + Date.now(),
      date: today,
      theme,
      description,
      status: "active",
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured) {
      // 1. Deactivate other active challenges first
      const q = query(collection(db, "challenges"), where("status", "==", "active"));
      const snapshot = await getDocs(q);
      for (const d of snapshot.docs) {
        await updateDoc(doc(db, "challenges", d.id), { status: "completed" });
      }
      // 2. Add new active challenge
      await setDoc(doc(db, "challenges", newChallenge.id), newChallenge);
      return newChallenge;
    } else {
      let challenges = JSON.parse(localStorage.getItem("zc_challenges") || "[]");
      // Mark all as completed
      challenges = challenges.map(c => ({ ...c, status: "completed" }));
      challenges.unshift(newChallenge);
      localStorage.setItem("zc_challenges", JSON.stringify(challenges));
      return newChallenge;
    }
  },

  // 3. SUBMISSIONS
  getSubmissions: async (challengeId) => {
    if (isFirebaseConfigured) {
      const q = query(collection(db, "submissions"), where("challengeId", "==", challengeId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data());
    } else {
      const subs = JSON.parse(localStorage.getItem("zc_submissions") || "[]");
      return subs.filter(s => s.challengeId === challengeId);
    }
  },

  getAllWinners: async () => {
    let firebaseWinners = [];
    if (isFirebaseConfigured) {
      const q = query(collection(db, "submissions"), where("isWinner", "==", true));
      const querySnapshot = await getDocs(q);
      firebaseWinners = querySnapshot.docs.map(doc => {
        const sub = doc.data();
        return {
          id: sub.id,
          date: sub.timestamp ? sub.timestamp.split("T")[0] : new Date().toISOString().split("T")[0],
          theme: sub.challengeTheme || "Reto Diario",
          winnerName: sub.userName,
          winnerInstagram: sub.userInstagram || "zoomcreativo.ok",
          photoUrl: sub.photoUrl,
          description: sub.caption,
          techniques: sub.techniques || [],
          likes: sub.likes || 0,
          applause: sub.applause || 0,
          adminFeedback: sub.adminFeedback
        };
      });
    } else {
      const subs = JSON.parse(localStorage.getItem("zc_submissions") || "[]");
      const challengeMap = {};
      const chs = JSON.parse(localStorage.getItem("zc_challenges") || "[]");
      chs.forEach(c => { challengeMap[c.id] = c; });

      firebaseWinners = subs.filter(s => s.isWinner).map(sub => ({
        id: sub.id,
        date: sub.timestamp ? sub.timestamp.split("T")[0] : new Date().toISOString().split("T")[0],
        theme: challengeMap[sub.challengeId]?.theme || "Reto Diario",
        winnerName: sub.userName,
        winnerInstagram: sub.userInstagram || "zoomcreativo.ok",
        photoUrl: sub.photoUrl,
        description: sub.caption,
        techniques: sub.techniques || [],
        likes: sub.likes || 0,
        applause: sub.applause || 0,
        adminFeedback: sub.adminFeedback
      }));
    }

    // Merge static historic winners at the end so they populate the feed!
    return [...firebaseWinners, ...HISTORICO_GANADORES];
  },

  submitPhoto: async (challengeId, userEmail, userName, userInstagram, photoBase64, caption, techniques) => {
    let photoUrl = photoBase64;
    const subId = "sub_" + Date.now();

    if (isFirebaseConfigured) {
      // Upload Base64 photo to Firebase Storage
      const storageRef = ref(storage, `challenges/${challengeId}/${subId}.jpg`);
      await uploadString(storageRef, photoBase64, "data_url");
      photoUrl = await getDownloadURL(storageRef);

      // Get challenge theme name
      const chDoc = await getDoc(doc(db, "challenges", challengeId));
      const challengeTheme = chDoc.exists() ? chDoc.data().theme : "";

      const submission = {
        id: subId,
        challengeId,
        challengeTheme,
        userEmail,
        userName,
        userInstagram,
        photoUrl,
        caption,
        techniques,
        timestamp: new Date().toISOString(),
        isWinner: false,
        adminFeedback: null,
        likes: 0,
        applause: 0
      };

      await setDoc(doc(db, "submissions", subId), submission);
      return submission;
    } else {
      const subs = JSON.parse(localStorage.getItem("zc_submissions") || "[]");
      
      // Check if user already submitted for this challenge
      const existing = subs.find(s => s.challengeId === challengeId && s.userEmail.toLowerCase() === userEmail.toLowerCase());
      if (existing) {
        throw new Error("Ya has enviado una fotografía para el reto de hoy.");
      }

      const submission = {
        id: subId,
        challengeId,
        userEmail,
        userName,
        userInstagram,
        photoUrl,
        caption,
        techniques,
        timestamp: new Date().toISOString(),
        isWinner: false,
        adminFeedback: null,
        likes: 0,
        applause: 0
      };

      subs.unshift(submission);
      localStorage.setItem("zc_submissions", JSON.stringify(subs));
      return submission;
    }
  },

  selectWinner: async (submissionId, feedback) => {
    if (isFirebaseConfigured) {
      // 1. Mark submission as winner
      const subRef = doc(db, "submissions", submissionId);
      const subDoc = await getDoc(subRef);
      if (!subDoc.exists()) throw new Error("Participación no encontrada");

      const submission = subDoc.data();
      await updateDoc(subRef, {
        isWinner: true,
        adminFeedback: feedback
      });

      // 2. Set the challenge to completed
      await updateDoc(doc(db, "challenges", submission.challengeId), { status: "completed" });

      // 3. Send Notification to Winner
      const notifId = "n_" + Date.now();
      await setDoc(doc(db, "notifications", notifId), {
        id: notifId,
        recipientEmail: submission.userEmail,
        title: "🏆 ¡Ganaste el Reto del Día!",
        message: `Felicidades, tu fotografía para el reto '${submission.challengeTheme || ""}' ha sido seleccionada como la destacada del día. ¡Ahora puedes proponer la temática del mañana!`,
        isRead: false,
        timestamp: new Date().toISOString()
      });

      return { ...submission, isWinner: true, adminFeedback: feedback };
    } else {
      const subs = JSON.parse(localStorage.getItem("zc_submissions") || "[]");
      const subIndex = subs.findIndex(s => s.id === submissionId);
      if (subIndex === -1) throw new Error("Participación no encontrada");

      // Reset any other winner for this challenge just in case
      const challengeId = subs[subIndex].challengeId;
      subs.forEach(s => {
        if (s.challengeId === challengeId) s.isWinner = false;
      });

      subs[subIndex].isWinner = true;
      subs[subIndex].adminFeedback = feedback;
      localStorage.setItem("zc_submissions", JSON.stringify(subs));

      // Mark challenge completed
      const challenges = JSON.parse(localStorage.getItem("zc_challenges") || "[]");
      const chIndex = challenges.findIndex(c => c.id === challengeId);
      if (chIndex !== -1) {
        challenges[chIndex].status = "completed";
        localStorage.setItem("zc_challenges", JSON.stringify(challenges));
      }

      // Send Notification to Winner
      const notifs = JSON.parse(localStorage.getItem("zc_notifications") || "[]");
      notifs.push({
        id: "n_" + Date.now(),
        recipientEmail: subs[subIndex].userEmail,
        title: "🏆 ¡Ganaste el Reto del Día!",
        message: `Felicidades, tu fotografía ha sido seleccionada como la ganadora. Puedes enmarcar tu foto en tu perfil e ir definiendo el tema de mañana.`,
        isRead: false,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem("zc_notifications", JSON.stringify(notifs));

      return subs[subIndex];
    }
  },

  // 4. NOTIFICATIONS
  getNotifications: async (userEmail) => {
    if (isFirebaseConfigured) {
      const q = query(
        collection(db, "notifications"), 
        where("recipientEmail", "==", userEmail)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data()).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } else {
      const notifs = JSON.parse(localStorage.getItem("zc_notifications") || "[]");
      return notifs
        .filter(n => n.recipientEmail.toLowerCase() === userEmail.toLowerCase())
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }
  },

  sendBroadcastNotification: async (title, message) => {
    if (isFirebaseConfigured) {
      const usersSnap = await getDocs(collection(db, "users"));
      for (const uDoc of usersSnap.docs) {
        const u = uDoc.data();
        const notifId = "n_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
        await setDoc(doc(db, "notifications", notifId), {
          id: notifId,
          recipientEmail: u.email,
          title,
          message,
          isRead: false,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      const users = JSON.parse(localStorage.getItem("zc_users") || "[]");
      const notifs = JSON.parse(localStorage.getItem("zc_notifications") || "[]");
      users.forEach(u => {
        notifs.push({
          id: "n_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
          recipientEmail: u.email,
          title,
          message,
          isRead: false,
          timestamp: new Date().toISOString()
        });
      });
      localStorage.setItem("zc_notifications", JSON.stringify(notifs));
    }
  },

  markNotificationRead: async (notificationId) => {
    if (isFirebaseConfigured) {
      await updateDoc(doc(db, "notifications", notificationId), { isRead: true });
    } else {
      const notifs = JSON.parse(localStorage.getItem("zc_notifications") || "[]");
      const index = notifs.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        notifs[index].isRead = true;
        localStorage.setItem("zc_notifications", JSON.stringify(notifs));
      }
    }
  },

  // 5. ENGAGEMENT SIMULATION (Applause & Likes)
  addInteraction: async (winnerId, type) => {
    // Only in local storage mode for simplicity
    const key = `zc_interact_${winnerId}_${type}`;
    if (localStorage.getItem(key)) {
      throw new Error("Ya has interactuado con esta foto.");
    }
    localStorage.setItem(key, "true");

    const subs = JSON.parse(localStorage.getItem("zc_submissions") || "[]");
    const subIndex = subs.findIndex(s => s.id === winnerId);
    if (subIndex !== -1) {
      subs[subIndex][type] = (subs[subIndex][type] || 0) + 1;
      localStorage.setItem("zc_submissions", JSON.stringify(subs));
      return subs[subIndex][type];
    } else {
      // Find in historic data
      const hIndex = HISTORICO_GANADORES.findIndex(h => h.id === winnerId);
      if (hIndex !== -1) {
        HISTORICO_GANADORES[hIndex][type] = (HISTORICO_GANADORES[hIndex][type] || 0) + 1;
        return HISTORICO_GANADORES[hIndex][type];
      }
    }
    return 0;
  }
};
