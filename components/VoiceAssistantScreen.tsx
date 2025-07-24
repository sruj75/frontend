import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
  useColorScheme,
} from 'react-native';
import {
  LiveKitRoom,
  AudioSession,
  registerGlobals,
  useVoiceAssistant,
  useLocalParticipant,
  useParticipantTracks,
  useTrackTranscription,
  BarVisualizer,        
} from '@livekit/react-native';
import { Track } from 'livekit-client';
import { useVoiceAgentConnection } from '../hooks/useVoiceAgentConnection';

registerGlobals();

// Main component that sets up the LiveKit room
export default function VoiceAssistantScreen() {
  const { details: connectionDetails, isLoading } = useVoiceAgentConnection();

  useEffect(() => {
    // Start audio session when component mounts
    const startAudio = async () => { // Async function to initialize device microphone/speakers
      await AudioSession.startAudioSession(); // Tells device "we want to use audio
    };
    startAudio();

    // Cleanup when component unmounts
    return () => {
      AudioSession.stopAudioSession();
    };
  }, []);

  // Show loading while fetching connection details
  if (isLoading || !connectionDetails) {
    return ( // Ensures text doesn't get cut off by device notches
      <SafeAreaView style={styles.container}> 
        <Text style={styles.loadingText}>Connecting to voice agent...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LiveKitRoom
        serverUrl={connectionDetails.url}
        token={connectionDetails.token}
        connect={true}
        audio={true}
        video={false} // Voice only!
      >
        <VoiceAssistantRoom />
      </LiveKitRoom>
    </SafeAreaView>
  );
}

// The actual voice assistant interface
function VoiceAssistantRoom() {
  const { state, audioTrack } = useVoiceAssistant(); // Gets voice assistant state (listening, thinking, speaking) and audio track
  const { isMicrophoneEnabled, localParticipant } = useLocalParticipant(); // Gets microphone state and local participant
  const colorScheme = useColorScheme(); // Gets color scheme for dark/light mode

  // Get real transcriptions
  const localTracks = useParticipantTracks(
    [Track.Source.Microphone], 
    localParticipant.identity
  );
  
  const { segments: userTranscriptions } = useTrackTranscription(localTracks[0]);

  const toggleMicrophone = () => {
    localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  return (
    <View style={styles.roomContainer}>
      {/* Audio Visualizer Section */}
      <View style={styles.visualizerSection}>
        <Text style={[
          styles.stateText,
          { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }
        ]}>
          {state || 'initializing'}
        </Text>
        
        <BarVisualizer
          state={state}
          barCount={7}
          trackRef={audioTrack}
          options={{
            minHeight: 0.5,
          }}
          style={styles.barVisualizer}
        />
      </View>

      {/* Real Conversation Section */}
      <ScrollView style={styles.conversationSection}>
        {/* Show latest user transcription */}
        {userTranscriptions.length > 0 && (
          <UserMessage 
            text={userTranscriptions[userTranscriptions.length - 1].text} 
          />
        )}
        
        {/* Show agent response when available */}
        {state === 'speaking' && (
          <AgentMessage text="Agent is responding..." />
        )}
      </ScrollView>

      {/* Controls Section - Keep your existing code */}
      <View style={styles.controlsSection}>
        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            {
              backgroundColor: pressed
                ? '#E0E0E0'
                : isMicrophoneEnabled
                ? '#007DFF'
                : '#FF3B30',
            },
          ]}
          onPress={toggleMicrophone}
        >
          <Text style={styles.buttonText}>
            {isMicrophoneEnabled ? '🎤' : '🚫'}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            { backgroundColor: pressed ? '#E0E0E0' : '#FF3B30' },
          ]}
          onPress={() => console.log('Exit pressed')}
        >
          <Text style={styles.buttonText}>❌</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Message components
function UserMessage({ text }: { text: string }) {
  const colorScheme = useColorScheme();
  
  return text ? (
    <View style={styles.userMessageContainer}>
      <Text style={[
        styles.userMessage,
        {
          backgroundColor: colorScheme === 'dark' ? '#404040' : '#B0B0B0',
          color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
        },
      ]}>
        {text}
      </Text>
    </View>
  ) : null;
}

function AgentMessage({ text }: { text: string }) {
  const colorScheme = useColorScheme();
  
  return text ? (
    <Text style={[
      styles.agentMessage,
      { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' },
    ]}>
      {text}
    </Text>
  ) : null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  roomContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
  // Three main sections
  visualizerSection: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  conversationSection: {
    flex: 1,
    padding: 16,
  },
  controlsSection: {
    height: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  
  // State and visualizer
  stateText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  placeholderVisualizer: {
    width: '80%',
    height: 60,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualizerText: {
    fontSize: 16,
    color: '#666',
  },
  barVisualizer: {
    width: '80%',
    height: 60,
  },
  
  // Message styling
  userMessageContainer: {
    alignItems: 'flex-end',
    marginVertical: 4,
  },
  userMessage: {
    fontSize: 16,
    borderRadius: 12,
    padding: 12,
    maxWidth: '80%',
  },
  agentMessage: {
    fontSize: 16,
    marginVertical: 4,
    marginLeft: 8,
  },
  
  // Control buttons
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  buttonText: {
    fontSize: 24,
  },
});
