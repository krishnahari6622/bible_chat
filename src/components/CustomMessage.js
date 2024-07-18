import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Button } from 'react-native';

const CustomMessage = ({ currentMessage }) => {
  if (!currentMessage || currentMessage.role === 'system') {
    return null;
  }

  const logSavedMessages = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem('savedMessages');
      const messages = savedMessages ? JSON.parse(savedMessages) : [];
      console.log('Saved messages:', messages);
    } catch (error) {
      console.error('Error retrieving saved messages:', error);
    }
  };
  const saveMessage = async (message) => {
    try {
      const savedMessages = await AsyncStorage.getItem('savedMessages');
      let messages = savedMessages ? JSON.parse(savedMessages) : [];
      let messageToBeSaved = {
        time: new Date().toISOString(),
        message: message,
      };
      messages.push(messageToBeSaved);
      await AsyncStorage.setItem('savedMessages', JSON.stringify(messages));
      console.log('Message saved successfully');
      await logSavedMessages();
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const isUser = currentMessage.role === 'user';

  return (
    <View
      style={[
        styles.messageContainer,
        isUser ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      <Text style={styles.messageText}>{currentMessage.content}</Text>
      <TouchableOpacity>
        <Button
          title="Save"
          onPress={() => {
            saveMessage(currentMessage.content);
          }}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
  },
});

const renderMessage = (props) => <CustomMessage {...props} />;

export default renderMessage;
