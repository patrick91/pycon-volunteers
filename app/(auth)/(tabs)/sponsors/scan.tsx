import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useIsEmulator } from 'react-native-device-info';

import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { UserProfileFromUrl } from '@/components/sponsors/user-profile/from-url';

export default function SponsorScan() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState<string | null>(null);

  const { result: isEmulator } = useIsEmulator();

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();

      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  const personSheet = useRef<BottomSheetModal>(null);

  const renderBackdrop = useCallback((props: any) => {
    return <BottomSheetBackdrop {...props} pressBehavior="close" />;
  }, []);

  const handleBarCodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    setScanned(data);
    personSheet.current?.present();
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  console.log(isEmulator);

  return (
    <View className="flex-1 justify-center items-center">
      {isEmulator ? (
        <View className="flex-1 justify-center items-center">
          <Text>Emulator</Text>
          <Button
            title="Scan"
            onPress={() =>
              handleBarCodeScanned({
                type: 'qr',
                data: 'https://www.google.com',
              })
            }
          />
        </View>
      ) : (
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {scanned && (
        <Button onPress={() => setScanned(null)} title="Scan again" />
      )}

      <BottomSheetModal
        ref={personSheet}
        onChange={() => {}}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
      >
        <BottomSheetScrollView>
          <UserProfileFromUrl url={scanned || ''} />
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  );
}
