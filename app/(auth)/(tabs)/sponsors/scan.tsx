import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { Text, View, StyleSheet as RNStyleSheet, Button } from 'react-native';
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
import { useCurrentConference } from '@/hooks/use-current-conference';
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

  const { code } = useCurrentConference();

  const handleBarCodeScanned = ({
    data,
  }: {
    data: string;
  }) => {
    setScanned(data);
    personSheet.current?.present();

    console.log(data);

    scanBadge({
      variables: {
        input: {
          url: data,
          conferenceCode: code,
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

  return (
    <View style={styles.centeredFlex}>
      {isEmulator ? (
        <View style={styles.centeredFlex}>
          <Text>Emulator</Text>
          <Button
            title="Scan"
            onPress={() =>
              handleBarCodeScanned({
                data: 'https://pycon.it/b/wqdkk',
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
          style={RNStyleSheet.absoluteFillObject}
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
          <View style={styles.centeredFlex}>
            {loading ? (
              <Text>Loading...</Text>
            ) : (
              <View style={styles.profileContainer}>
                {data?.scanBadge.__typename === 'BadgeScan' ? (
                  <UserProfile
                    attendee={data.scanBadge.attendee}
                    badgeId={data.scanBadge.id}
                    notes={data.scanBadge.notes}
                  />
                ) : (
                  <Text>{data?.scanBadge.message}</Text>
                )}
              </View>
            )}
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  );
}

const styles = RNStyleSheet.create({
  centeredFlex: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContainer: {
    flex: 1,
    paddingBottom: 56,
    width: '100%',
    paddingHorizontal: 32,
  },
});
