import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Colors } from '../../theme';

interface LoadingProps {
  text?: string;
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ text, fullScreen = false }) => {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size="large" color={Colors.accentBlue} />
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.accentBlue} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.appBackground,
  },
  text: {
    color: Colors.textGray,
    fontSize: 14,
    marginTop: 12,
  },
});

export default Loading;
