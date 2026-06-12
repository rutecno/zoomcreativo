import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- 1. LOAD CONFIGURATION FROM .ENV FILE ---
const envPath = path.resolve(process.cwd(), '.env');
const config = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      config[key.trim()] = value;
    }
  });
  console.log('📝 Archivo de configuracion .env cargado con exito.');
} else {
  console.warn('⚠️ Archivo .env no encontrado. Crea uno siguiendo la guia en walkthrough.md para conectar a Firebase.');
}

const firebaseConfig = {
  apiKey: config.VITE_FIREBASE_API_KEY,
  authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: config.VITE_FIREBASE_PROJECT_ID,
  storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: config.VITE_FIREBASE_APP_ID
};

const GROUP_ID = config.VITE_WHATSAPP_GROUP_ID; // Guardaremos el ID del grupo de WhatsApp aqui
const ADMIN_NUMBER = config.VITE_ADMIN_PHONE;   // Tu numero de celular de administrador (ej: '573001234567@c.us')

// --- 2. INITIALIZE FIREBASE APP ---
let db, storage, isFirebaseActive = false;
if (firebaseConfig.apiKey) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    isFirebaseActive = true;
    console.log('🔥 Firebase conectado exitosamente al Bot.');
  } catch (err) {
    console.error('❌ Error al conectar el Bot con Firebase:', err);
  }
} else {
  console.log('ℹ️ Firebase sin configurar. El bot no podra actualizar la web real.');
}

// --- 3. INITIALIZE WHATSAPP CLIENT ---
console.log('🤖 Iniciando el cliente de WhatsApp...');
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }
});

// Generate QR Code for Login
client.on('qr', (qr) => {
  console.log('\n📱 ESCANEA ESTE CODIGO QR CON TU WHATSAPP PARA INICIAR SESION:\n');
  qrcode.generate(qr, { small: true });
});

// Ready Event
client.on('ready', () => {
  console.log('\n🤖 ¡El Bot de Zoom Creativo esta LISTO y escuchando mensajes!\n');
});

// Listen to messages
client.on('message_create', async (message) => {
  try {
    const chat = await message.getChat();
    const cleanText = message.body ? message.body.trim().toLowerCase() : '';
    
    // Print message log to help debug
    if (message.body) {
      console.log(`[LOG] Mensaje: "${message.body}" | Chat: "${chat.name}" | ID: "${chat.id._serialized}"`);
    }
    
    // Command to auto-configure .env from WhatsApp
    if (cleanText === '!configurar') {
      const senderId = message.author || message.from;
      const groupId = chat.id._serialized;


      // Update .env file programmatically
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }

      // Check if keys already exist and replace them, or append
      const keys = {
        VITE_WHATSAPP_GROUP_ID: groupId,
        VITE_ADMIN_PHONE: senderId
      };

      let lines = envContent.split('\n');
      Object.keys(keys).forEach(key => {
        const index = lines.findIndex(line => line.trim().startsWith(`${key}=`));
        if (index !== -1) {
          lines[index] = `${key}=${keys[key]}`;
        } else {
          lines.push(`${key}=${keys[key]}`);
        }
      });

      fs.writeFileSync(envPath, lines.join('\n').trim() + '\n', 'utf8');

      console.log(`⚙️ Configuracion del Bot actualizada automaticamente para el grupo: ${chat.name}`);
      await message.reply(`⚙️ *¡Configuracion Automatica Exitosa!*\n\nEste grupo (*${chat.name}*) ha sido enlazado a tu web.\n\nHe guardado los siguientes datos en tu archivo *.env*:\n• *Grupo ID:* \`${groupId}\`\n• *Celular Admin:* \`${senderId}\`\n\nEl bot ya esta listo para procesar los comandos \`!tema\` y \`!ganador\` en este chat.`);
      return;
    }


    // Only listen if Firebase is active and it's our group
    if (!isFirebaseActive) return;
    if (GROUP_ID && chat.id._serialized !== GROUP_ID) return;

    // Validate that the sender is the Administrator
    const senderId = message.author || message.from;
    const isAdmin = ADMIN_NUMBER ? senderId.includes(ADMIN_NUMBER) : true; // Default to true if not restricted
    if (!isAdmin) return;

    const text = message.body.trim();

    // COMMAND 1: Create New Challenge
    // Format: !tema [Titulo del Reto] - [Descripcion]
    if (text.startsWith('!tema ')) {
      const content = text.slice(6).trim();
      const parts = content.split('-');
      if (parts.length < 2) {
        await message.reply('❌ Formato invalido. Usa: `!tema [Titulo] - [Descripcion]`');
        return;
      }

      const theme = parts[0].trim();
      const description = parts[1].trim();
      const today = new Date().toISOString().split('T')[0];
      const challengeId = 'c_' + Date.now();

      // Deactivate old challenges
      const q = query(collection(db, "challenges"), where("status", "==", "active"));
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        await updateDoc(doc(db, "challenges", docSnap.id), { status: "completed" });
      }

      // Add new challenge to Firestore
      await setDoc(doc(db, "challenges", challengeId), {
        id: challengeId,
        date: today,
        theme,
        description,
        status: 'active',
        createdAt: new Date().toISOString()
      });

      console.log(`📸 Nuevo reto publicado desde WhatsApp: "${theme}"`);
      await message.reply(`📸 *¡Nuevo Reto Diario Publicado!*\n\n*Tema:* ${theme}\n*Descripcion:* ${description}\n\nLa pagina web ya ha sido actualizada.`);
      return;
    }

    // COMMAND 2: Select Winner by replying to a photograph message
    // Format: !ganador [Nombre del fotografo] - [Instagram sin @]
    if (text.startsWith('!ganador')) {
      if (!message.hasQuotedMsg) {
        await message.reply('❌ Debes *responder* a la foto ganadora con este comando.');
        return;
      }

      const content = text.slice(8).trim();
      const parts = content.split('-');
      if (parts.length < 2) {
        await message.reply('❌ Formato invalido. Usa: `!ganador [Nombre del fotografo] - [Instagram sin @]`');
        return;
      }

      const winnerName = parts[0].trim();
      const winnerInstagram = parts[1].trim();

      // Retrieve the replied message containing the photo
      const quotedMsg = await message.getQuotedMessage();
      if (!quotedMsg.hasMedia) {
        await message.reply('❌ El mensaje al que respondiste no contiene ninguna imagen.');
        return;
      }

      // Download photo from WhatsApp
      console.log('📥 Descargando fotografia ganadora de WhatsApp...');
      const media = await quotedMsg.downloadMedia();
      if (!media || !media.data) {
        await message.reply('❌ No se pudo descargar la imagen de los servidores de WhatsApp.');
        return;
      }

      // Get Active Challenge
      const challengesRef = collection(db, "challenges");
      const q = query(challengesRef, where("status", "==", "active"));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        await message.reply('❌ No hay ningun reto activo hoy en la base de datos.');
        return;
      }
      
      const activeChallenge = querySnapshot.docs[0].data();

      // Upload Photo to Firebase Storage
      console.log('📤 Subiendo fotografia ganadora a Firebase Storage...');
      const subId = 'sub_' + Date.now();
      const storageRef = ref(storage, `challenges/${activeChallenge.id}/${subId}.jpg`);
      
      // Convert base64 media data to Buffer
      const buffer = Buffer.from(media.data, 'base64');
      await uploadBytes(storageRef, buffer, { contentType: media.mimetype });
      const photoUrl = await getDownloadURL(storageRef);

      // Save Winner Submission to Firestore
      const submission = {
        id: subId,
        challengeId: activeChallenge.id,
        challengeTheme: activeChallenge.theme,
        userEmail: `ganador_${Date.now()}@zoomcreativo.com`, // Simulated email
        userName: winnerName,
        userInstagram: winnerInstagram,
        photoUrl,
        caption: 'Fotografia destacada elegida por los administradores.',
        techniques: ['Seleccion por WhatsApp Bot'],
        timestamp: new Date().toISOString(),
        isWinner: true,
        adminFeedback: {
          composition: 'Excelente composición seleccionada en el grupo oficial.',
          technique: 'Manejo impecable del disparo y la luz.',
          creativity: 'Destacada creatividad de enfoque móvil.',
          lighting: 'Correcta iluminacion del sujeto.',
          perspective: 'Buena perspectiva.',
          comment: 'Ganador diario oficial de Zoom Creativo.'
        },
        likes: 0,
        applause: 0
      };

      await setDoc(doc(db, "submissions", subId), submission);

      // Set Challenge to completed
      await updateDoc(doc(db, "challenges", activeChallenge.id), { status: "completed" });

      console.log(`🏆 Ganador registrado con exito: ${winnerName}`);
      await message.reply(`🏆 *¡Felicidades a ${winnerName}!* 🏆\n\nSu fotografia para el reto *"${activeChallenge.theme}"* ha sido seleccionada como ganadora y guardada en el portafolio.\n\nYa pueden ingresar a la web para verla y generar la foto enmarcada oficial.`);
    }

  } catch (err) {
    console.error('❌ Error procesando mensaje de WhatsApp:', err);
  }
});

client.initialize();
