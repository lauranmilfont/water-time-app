import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProgressScreen() {
  const [goal, setGoal] = useState(null);
  const [inputGoal, setInputGoal] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [consumed, setConsumed] = useState(0);

  useEffect(() => {
    loadGoal();
  }, []);

  const loadGoal = async () => {
    const savedGoal = await AsyncStorage.getItem('goal');
    if (savedGoal) {
      setGoal(parseInt(savedGoal));
    } else {
      setModalVisible(true);
    }
  };

  const saveGoal = async () => {
    await AsyncStorage.setItem('goal', inputGoal);
    setGoal(parseInt(inputGoal));
    setModalVisible(false);
  };

  const addWater = (amount) => {
    setConsumed(consumed + amount);
  };

  const percentage = goal ? (consumed / goal) * 100 : 0;

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Hora de beber água 💧</Text>

      {goal && (
        <>
          <View style={styles.circle}>
            <View style={[styles.fill, { height: `${percentage}%` }]} />
            <Text style={styles.circleText}>
              {consumed}/{goal} ml
            </Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => addWater(200)}
          >
            <Text style={styles.buttonText}>+ 200ml</Text>
          </TouchableOpacity>
        </>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Qual sua meta diária (ml)?</Text>
            <TextInput
              keyboardType="numeric"
              style={styles.input}
              value={inputGoal}
              onChangeText={setInputGoal}
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveGoal}>
              <Text style={styles.buttonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f2f2'
  },
  title: {
    fontSize: 22,
    marginBottom: 20
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#ddd',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  fill: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#5ec4c4'
  },
  circleText: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  button: {
    backgroundColor: '#118a9b',
    padding: 15,
    borderRadius: 12
  },
  buttonText: {
    color: 'white'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: 300
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 10
  },
  saveButton: {
    backgroundColor: '#118a9b',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center'
  }
});
