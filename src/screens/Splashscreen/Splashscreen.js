import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Splashscreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Zaheem</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
  },
});

export default Splashscreen;