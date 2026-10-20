import type { Receipt } from '../../../shared/contracts';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import ReceiptView from './ReceiptView';

interface ReceiptModalProps {
  receipt: Receipt | null;
  onClose: () => void;
}

export default function ReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  return (
    <Modal visible={Boolean(receipt)} animationType="slide" onRequestClose={onClose}>
      <View style={styles.receiptModal}>
        {receipt ? <ReceiptView receipt={receipt} /> : null}
        <Pressable onPress={onClose} style={styles.finalizeButton} accessibilityRole="button">
          <Text style={styles.finalizeText}>Done</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    receiptModal: { 
        flex: 1, 
        paddingBottom: 20 
    },
    finalizeButton: { 
        backgroundColor: '#17663c', 
        borderRadius: 8, alignItems: 'center', 
        padding: 15 
    },
    finalizeText: { 
        color: '#fff', 
        fontWeight: '700', 
        fontSize: 16 
    },
  }
);
