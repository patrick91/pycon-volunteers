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
import { graphql } from '@/graphql';
import { useMutation } from '@apollo/client';
import { UserProfile } from '@/components/sponsors/user-profile';

const SCAN_BADGE_MUTATION = graphql(`
  mutation ScanBadge($input: ScanBadgeInput!) {
    scanBadge(input: $input) {
      __typename

    ... on BadgeScan {
      id
      attendee {
        email
        fullName
      }

      notes
    }

    ... on ScanError {
      message
    }
    }
  }
`);

export default function SponsorScan() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState<string | null>(null);

  const [scanBadge, { loading, error, data }] =
    useMutation(SCAN_BADGE_MUTATION);

  console.log(loading, error, data);

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
    data,
  }: {
    data: string;
  }) => {
    setScanned(data);
    personSheet.current?.present();

    scanBadge({
      variables: {
        input: {
          url: data,
          // TODO: change to pycon2025
          conferenceCode: 'pycon2024',
        },
      },
    });
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
                data: 'https://pycon.it/b/goggg',
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
          <View className="flex-1 justify-center items-center">
            {loading ? (
              <Text>Loading...</Text>
            ) : (
              <View className="flex-1 pb-14 w-full px-8">
                <UserProfile
                  attendee={data?.scanBadge.attendee}
                  badgeId={data?.scanBadge.id}
                  notes={data?.scanBadge.notes}
                />
              </View>
            )}
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  );
}
