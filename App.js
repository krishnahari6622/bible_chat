import React, { useCallback, useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  Button,
  Platform,
} from 'react-native';
import { Bubble, GiftedChat } from 'react-native-gifted-chat';
import renderMessage from './src/components/CustomMessage';
import { sendMessage } from './src/services/sendMessageAPI';
import RNPickerSelect from 'react-native-picker-select';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Modal from 'react-native-modal';

const formatDate = (dateString) => {
  const options = { month: 'long', day: 'numeric' };
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', options);
};

const removeKeys = (messages) => {
  return messages.map((message) => {
    const { _id, user, ...rest } = message; // Destructure the message and exclude _id and user
    return rest; // Return the remaining object without _id and user
  });
};

const App = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const [selectedMode, setSelectedMode] = useState('friend');
  const [selectedLength, setSelectedLength] = useState('medium');
  const [modalVisible, setModalVisible] = useState(false);
  const [savedMessages, setSavedMessages] = useState([]);

  useEffect(() => {
    setContext({ mode: selectedMode });
  }, [selectedMode, selectedLength]);

  const onSend = useCallback(async (newMessages = []) => {
    const messageByUser = {
      _id: new Date().getTime(),
      user: {
        _id: 2,
      },
      role: 'user',
      content: newMessages[0].text,
    };

    setMessages((previousMessages) => {
      const updatedMessages = GiftedChat.append(
        previousMessages,
        messageByUser,
      );
      let payload = removeKeys(updatedMessages);
      console.log(payload);
      sendMessageAPI(updatedMessages);
      return updatedMessages;
    });
  }, []);

  const getMaxTokens = (length) => {
    switch (length) {
      case 'short':
        return 500;
      case 'medium':
        return 1500;
      case 'long':
        return 3000;
      default:
        return 1500;
    }
  };

  const setContext = async ({ mode }) => {
    const messageBySystem = {
      _id: new Date().getTime(),
      user: {
        _id: 2,
      },
      role: 'system',
      content: `Act as ${mode}`,
    };
    setMessages((previousMessages) => {
      const updatedMessages = GiftedChat.append(
        previousMessages,
        messageBySystem,
      );
      sendMessageAPI(updatedMessages);
      return updatedMessages;
    });
  };

  const sendMessageAPI = async (currentMessages) => {
    setIsTyping(true);
    try {
      const response = await sendMessage({
        model: 'gpt-4o',
        messages: currentMessages,
        max_tokens: getMaxTokens(selectedLength),
      });

      const replyFromAI = {
        _id: new Date().getTime(),
        user: {
          _id: 1,
        },
        role: response.choices[0].message.role,
        content: response.choices[0].message.content,
      };

      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, replyFromAI),
      );
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const logSavedMessages = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem('savedMessages');
      const messages = savedMessages ? JSON.parse(savedMessages) : [];
      setSavedMessages(messages);
      setModalVisible(true);
    } catch (error) {
      console.error('Error retrieving saved messages:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pickerContainer}>
        <RNPickerSelect
          placeholder={{
            label: 'Select Mode',
            value: null,
            color: '#9EA0A4',
          }}
          value={selectedMode}
          onValueChange={(value) => setSelectedMode(value)}
          items={[
            { label: 'Friend', value: 'friend' },
            { label: 'Guide', value: 'guide' },
            { label: 'Therapist', value: 'therapist' },
            { label: 'Scholar', value: 'scholar' },
          ]}
          style={pickerSelectStyles}
        />
        <RNPickerSelect
          placeholder={{
            label: 'Response Message Length',
            value: null,
            color: '#9EA0A4',
          }}
          value={selectedLength}
          onValueChange={(value) => setSelectedLength(value)}
          items={[
            { label: 'Short', value: 'short' },
            { label: 'Medium', value: 'medium' },
            { label: 'Long', value: 'long' },
          ]}
          style={pickerSelectStyles}
        />
      </View>
      <GiftedChat
        messages={messages}
        onSend={onSend}
        renderMessage={renderMessage}
        isTyping={isTyping}
        user={{
          _id: 2,
        }}
      />
      <TouchableOpacity style={styles.showMessagesButton}>
        <Button
          title="Show Saved Messages"
          onPress={logSavedMessages}
          color="#007AFF"
        />
      </TouchableOpacity>
      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Saved Messages</Text>
          <FlatList
            data={savedMessages}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.messageItem}>
                <Text style={styles.messageItemText}>
                  {formatDate(item.time)} : {item.message}
                </Text>
              </View>
            )}
            ListEmptyComponent={() => <Text>No saved messages</Text>}
          />
          <Button
            title="Close"
            onPress={() => {
              setModalVisible(false);
            }}
            color="#007AFF"
          />
        </View>
      </Modal>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: '#f0f0f0',
    marginVertical: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'purple',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: '#f0f0f0',
    marginVertical: 10,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  pickerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  showMessagesButton: {
    margin: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  messageItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  messageItemText: {
    fontSize: 16,
  },
});

export default App;
