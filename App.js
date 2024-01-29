import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { initializeApp } from 'firebase/app';
import { FirebaseAnalyticsJS } from 'expo-firebase-analytics';
import {
  getAuth, // Agrega la importación de getAuth
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut, // Si lo necesitas, agrega la importación de signOut
} from 'firebase/auth';
import {
  getDatabase,
  ref as databaseRef,
  push,
  onValue,
} from 'firebase/database';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';


// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBgsrOOfNu3xq9qUcJPMakjo43bvDrkdgs",
  authDomain: "theresa-8e74a.firebaseapp.com",
  databaseURL: "https://theresa-8e74a-default-rtdb.firebaseio.com",
  projectId: "theresa-8e74a",
  storageBucket: "theresa-8e74a.appspot.com",
  messagingSenderId: "503919099413",
  appId: "1:503919099413:web:de0ab049b06dde06fe981c",
  measurementId: "G-Z7N6KLRTQ0"
};


const app = initializeApp(firebaseConfig);
const analytics = FirebaseAnalyticsJS;
const auth = getAuth(); 


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 10,
  }
});

export default function App() {
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState({ value: '', error: null });
  const [fecha, setFecha] = useState('');
  const [imagen, setImagen] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoggedIn(!!user);
    });
    const unsubscribeData = onValue(databaseRef(getDatabase(), 'formulario'), () => {
      // Actualizar la interfaz si los datos en la base de datos cambian
    });

    return () => {
      unsubscribeAuth(); // Limpiar el listener al desmontar el componente
      unsubscribeData();
    };
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.cancelled) {
      const response = await fetch(result.uri);
      const blob = await response.blob();

      const storage = getStorage();
      const storageRef = ref(storage, `imagenes/${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);

      setImagen(downloadURL);
    }
  };

  const handleSubmit = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const numericDni = dni ? parseInt(dni) : '';
      const numericMonto = monto.value ? parseInt(monto.value) : '';
      const isoDateString = fecha ? new Date(fecha).toISOString() : '';

      const data = {
        dni: numericDni,
        nombre,
        monto: numericMonto,
        fecha: isoDateString,
        imagen,
      };

      const database = getDatabase();
      push(databaseRef(database, 'formulario'), data);

      // Limpiar el formulario después de enviar los datos
      setDni('');
      setNombre('');
      setMonto({ value: '', error: null });
      setFecha('');
      setImagen('');

      // Cerrar sesión después de enviar los datos (opcional)
      // await signOut(auth);
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al enviar los datos. Por favor, inténtelo de nuevo.');
    }
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
      setIsLoggedIn(true);
    } catch (error) {
      Alert.alert('Error', 'Correo electrónico o contraseña incorrectos.');
    }
  };

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
      setIsLoggedIn(true);
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al registrar el usuario. Por favor, inténtelo de nuevo.');
    }
  };
  return (
    <View style={styles.container}>
      {isLoggedIn ? (
        <View>
          <Text style={styles.label}>DNI:</Text>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setDni(text)}
            value={dni}
          />
  
          <Text style={styles.label}>Nombre:</Text>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setNombre(text)}
            value={nombre}
          />
  
          <Text style={styles.label}>Monto:</Text>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setMonto({ ...monto, value: text })}
            value={monto.value}
          />
          {monto.error ? (
            <Text style={styles.errorText}>{monto.error}</Text>
          ) : null}
  
          <Text style={styles.label}>Fecha:</Text>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setFecha(text)}
            value={fecha}
          />
  
          <Pressable style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Seleccionar Imagen</Text>
          </Pressable>
  
          {imagen ? (
            <Image source={{ uri: imagen }} style={styles.image} />
          ) : null}
          <Pressable style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Enviar</Text>
          </Pressable>
        </View>
      ) : (
        <View>
          {user ? (
            <View>
              <Text>Bienvenido, {user.email}!</Text>
            </View>
          ) : (
            <View>
              <Text style={styles.label}>Correo Electrónico:</Text>
              <TextInput
                style={styles.input}
                onChangeText={(text) => setEmail(text)}
                value={email}
              />
  
              <Text style={styles.label}>Contraseña:</Text>
              <TextInput
                style={styles.input}
                onChangeText={(text) => setPassword(text)}
                value={password}
                secureTextEntry
              />
  
              <Pressable style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Iniciar Sesión</Text>
              </Pressable>
  
              <Pressable style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Registrarse</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}