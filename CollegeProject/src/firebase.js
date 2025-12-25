import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBkqkR7I2_UOKgGWFUN-XSbQak4KDipdPQ",
  authDomain: "attendance-389e2.firebaseapp.com",
  projectId: "attendance-389e2",
  storageBucket: "attendance-389e2.appspot.com",
  messagingSenderId: "830410571846",
  appId: "1:830410571846:web:4f28b8620f9901dd0e4a47"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);