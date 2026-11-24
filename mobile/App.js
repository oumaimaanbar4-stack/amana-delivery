import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './screens/LoginScreen';

export default function App() {
  const [facteur, setFacteur] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const savedSession = await AsyncStorage.getItem('facteur_session');
        if (savedSession) {
          setFacteur(JSON.parse(savedSession));
        }
      } finally {
        setCheckingSession(false);
      }
    }

    loadSession();
  }, []);

  async function handleLogout() {
    await AsyncStorage.removeItem('facteur_session');
    setFacteur(null);
  }

  if (checkingSession) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  if (!facteur) {
    return <LoginScreen onLoginSuccess={(loggedFacteur) => setFacteur(loggedFacteur)} />;
  }

  return (
    <View style={styles.center}>
      <Text style={styles.welcome}>
        Bienvenue, {facteur.prenom} {facteur.nom}
      </Text>
      <Text style={styles.info}>Matricule : {facteur.matricule}</Text>
      <Text style={styles.info}>Appareil lié : {facteur.device_id}</Text>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  welcome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  info: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 6,
  },
  logoutBtn: {
    marginTop: 24,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});