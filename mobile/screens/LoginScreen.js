import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

export default function LoginScreen({ onLoginSuccess }) {
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Récupère l'identifiant unique du téléphone
  async function getDeviceId() {
    if (Platform.OS === 'android') {
      return Application.getAndroidId();
    }

    if (Platform.OS === 'ios') {
      const iosId = await Application.getIosIdForVendorAsync();
      return iosId;
    }

    return 'unknown-device';
  }

  async function handleLogin() {
    const cleanMatricule = matricule.trim();
    const cleanPassword = password.trim();

    if (!cleanMatricule || !cleanPassword) {
      Alert.alert(
        'Champs requis',
        'Veuillez saisir votre matricule et votre mot de passe.'
      );
      return;
    }

    setLoading(true);

    try {
      const currentDeviceId = await getDeviceId();

      // 1. Recherche du facteur par matricule
      const { data: rows, error } = await supabase
        .from('facteurs')
        .select('*')
        .ilike('matricule', cleanMatricule);

      if (error) {
        Alert.alert('Erreur Supabase', error.message);
        return;
      }

      const facteur = rows && rows.length > 0 ? rows[0] : null;

      if (!facteur) {
        Alert.alert(
          'Connexion refusée',
          `Aucun facteur trouvé pour le matricule "${cleanMatricule}".`
        );
        return;
      }

      // 2. Vérification du mot de passe
      if (facteur.password !== cleanPassword) {
        Alert.alert('Connexion refusée', 'Mot de passe incorrect.');
        return;
      }

      // 3. Vérification / liaison du device_id
      let updatedFacteur = facteur;

      if (!facteur.device_id) {
        const { data: linkedData, error: updateError } = await supabase
          .from('facteurs')
          .update({ device_id: currentDeviceId })
          .eq('facteur_id', facteur.facteur_id)
          .select()
          .single();

        if (updateError) {
          Alert.alert('Erreur', "Impossible d'associer cet appareil au compte.");
          return;
        }

        updatedFacteur = linkedData;
      } else if (facteur.device_id !== currentDeviceId) {
        Alert.alert(
          'Appareil non autorisé',
          'Ce matricule est déjà lié à un autre téléphone.'
        );
        return;
      }

      // 4. Sauvegarde locale de la session facteur
      await AsyncStorage.setItem(
        'facteur_session',
        JSON.stringify(updatedFacteur)
      );

      if (onLoginSuccess) {
        onLoginSuccess(updatedFacteur);
      }
    } catch (err) {
      Alert.alert(
        'Erreur détaillée',
        err?.message || 'Une erreur est survenue lors de la connexion.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Amana Delivery</Text>
      <Text style={styles.subtitle}>Connexion Facteur</Text>

      <TextInput
        style={styles.input}
        placeholder="Matricule"
        value={matricule}
        onChangeText={setMatricule}
        autoCapitalize="characters"
      />

      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Se connecter</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 28,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#1E40AF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});