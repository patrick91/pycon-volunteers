import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { Text, View, StyleSheet, Platform } from 'react-native';
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
import { useIsFocused } from '@react-navigation/native';
import { Button } from '@/components/form/button';
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

const LeadScanCamera = ({
  handleBarCodeScanned,
}: {
  handleBarCodeScanned: (scanningResult: { data: string }) => void;
}) => {
  const { result: isEmulator } = useIsEmulator();

  if (isEmulator) {
    return (
      <View className="flex-1 justify-center items-center">
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
    );
  }

  return (
    <CameraView
      onBarcodeScanned={handleBarCodeScanned}
      barcodeScannerSettings={{
        barcodeTypes: ['qr'],
      }}
      style={StyleSheet.absoluteFillObject}
    />
  );
};

export default function SponsorScan() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState<string | null>(null);

  const [scanBadge, { loading, data }] = useMutation(SCAN_BADGE_MUTATION);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();

      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  const personSheet = useRef<BottomSheetModal>(null);

  const renderBackdrop = useCallback((props: any) => {
    return (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        pressBehavior="close"
        disappearsOnIndex={-1}
      />
    );
  }, []);

  const { code } = useCurrentConference();

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
          conferenceCode: code,
        },
      },
    });
  };

  const focused = useIsFocused();

  if (hasPermission === null) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Requesting for camera permission</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View className="flex-1 justify-center items-center gap-4">
        <Text className="text-lg font-semibold">No access to camera</Text>
        <Text className="text-center text-gray-600 px-8">
          To enable camera access:
        </Text>
        {Platform.OS === 'ios' ? (
          <View className="px-8">
            <Text className="font-semibold">iOS Instructions:</Text>
            <Text>
              1. Go to Settings {'>'} Privacy {'>'} Camera
            </Text>
            <Text>2. Find this app and toggle camera access on</Text>
          </View>
        ) : (
          <View className="px-8">
            <Text className="font-semibold">Android Instructions:</Text>
            <Text>1. Go to Settings {'>'} Apps</Text>
            <Text>2. Find this app and tap Permissions</Text>
            <Text>3. Toggle camera access on</Text>
          </View>
        )}
      </View>
    );
  }

  if (!focused) {
    return null;
  }

  return (
    <View className="flex-1 justify-center items-center">
      {scanned ? (
        <Button onPress={() => setScanned(null)}>Scan again</Button>
      ) : (
        <LeadScanCamera handleBarCodeScanned={handleBarCodeScanned} />
      )}

      <BottomSheetModal
        ref={personSheet}
        onChange={() => {}}
        snapPoints={['90%']}
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
      >
        <BottomSheetScrollView>
          <View className="flex-1 justify-center items-center">
            {loading ? (
              <Text>Loading...</Text>
            ) : (
              <View className="flex-1 pb-14 w-full px-8">
                <Text className="text-center text-gray-600 mb-4">
                  Scanned! You can add notes to the attendee here, and you'll
                  find the attendee in the list of leads.
                </Text>

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
