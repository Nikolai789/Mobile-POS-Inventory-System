import { useRef, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ActivityIndicator, Button, Modal, StyleSheet, Text, View } from 'react-native';

const scannerSettings = {
  barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code39', 'code93', 'code128', 'itf14', 'codabar'],
};

export default function BarcodeScannerModal({
  visible, onClose, onScan, onScanNext, feedback, busy = false, retryCode, onRetry,
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [armed, setArmed] = useState(true);
  const [cameraError, setCameraError] = useState('');
  const locked = useRef(false);

  function handleScan(result) {
    const barcode = typeof result.data === 'string' ? result.data.trim() : '';
    if (!barcode || locked.current) return;
    locked.current = true;
    setArmed(false);
    onScan(barcode);
  }

  function scanNext() {
    locked.current = false;
    setArmed(true);
    setCameraError('');
    onScanNext?.();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>Scan product barcode</Text>
        <Text style={styles.hint}>Point the camera at a retail barcode.</Text>
        {permission == null ? <ActivityIndicator accessibilityLabel="Checking camera permission" /> : null}
        {permission && !permission.granted ? <View style={styles.message}>
          <Text>Camera access is needed to scan. You can still enter a barcode or use search manually.</Text>
          {permission.canAskAgain ? <Button title="Allow camera" onPress={requestPermission} /> : null}
        </View> : null}
        {permission?.granted && armed && visible ? <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={scannerSettings}
          onBarcodeScanned={handleScan}
          onMountError={(event) => { setCameraError(event.message); setArmed(false); }}
        /> : null}
        {permission?.granted && !armed ? <View style={styles.message}>
          <Text>{cameraError || feedback || (busy ? 'Checking barcode...' : 'Barcode captured.')}</Text>
          {busy ? <ActivityIndicator accessibilityLabel="Checking barcode" /> : null}
          {retryCode && onRetry && !busy ? <Button title="Retry lookup" onPress={onRetry} /> : null}
          {!cameraError ? <Button title="Scan next" onPress={scanNext} disabled={busy} /> : null}
        </View> : null}
        <Button title="Close scanner" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700' },
  hint: { color: '#555' },
  camera: { flex: 1, minHeight: 260, borderRadius: 12, overflow: 'hidden' },
  message: { flex: 1, justifyContent: 'center', gap: 16 },
});
