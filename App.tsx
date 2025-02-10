/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {PropsWithChildren} from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import { discoverNearbyDevicesAPI } from './api/discoverNearbyDevicesAPI';
import { useDispatch } from 'react-redux';
import { BluetoothService } from './services/BluetoothService';
import { normalize } from './utils/responsive';

function App(): React.JSX.Element {
  const dispatch = useDispatch()

  const [trigger, { data }] = discoverNearbyDevicesAPI.useLazyScanQuery()
  const [isFetching, setIsFetching] = useState(false)
  const [progressMessage, setProgressMessage] = useState<{title: string, message: string}>()
  const [keyword, setKeyword] = useState<string>("")
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<BluetoothService.BLEDeviceData | undefined>(undefined)
  const [nearbyDevices, setNearbyDevices] = useState<BluetoothService.BLEDeviceData[]>(data?.devices ?? [])

  useEffect(() => {
    if ((data?.devices ?? []).length > 0 && data?.devices != undefined) {
      setNearbyDevices(data.devices)
    }
  }, [data?.devices])

  useEffect(() => {
    if (data?.progressMessage != undefined) {
      Alert.alert(data.progressMessage.title, data.progressMessage.message, [
        {text: 'OK', onPress: () => {
          if (!data.isScanning) {
            dispatch(discoverNearbyDevicesAPI.util.resetApiState()) 
          }
        }},
      ]);
    }
  }, [data?.progressMessage])

  useEffect(() => {
    // if (isFetching && data?.isScanning == false) {
    //   setTimeout(() => {
    //     dispatch(discoverNearbyDevicesAPI.util.resetApiState()) 
    //   }, 250)
    // }
    setIsFetching(data?.isScanning ?? isFetching)
  }, [data?.isScanning])

  const filteredNearbyDevice = useMemo(() => {
    if (keyword.length == 0) { return nearbyDevices }

    return nearbyDevices.filter((val: BluetoothService.BLEDeviceData) => {
      return val.address.toLowerCase().includes(keyword.toLowerCase()) || (val.name).toLowerCase().includes(keyword.toLowerCase())
    })
  }, [keyword, nearbyDevices])

  const scanBLEDevice = useCallback(() => {
    setNearbyDevices([])
    setKeyword("")
    trigger()
  }, [])

  const stopScanBLEDevice = useCallback(() => {
    dispatch(discoverNearbyDevicesAPI.util.resetApiState()) 
    setIsFetching(false)
    Alert.alert("Scanning Done!", "Scanning done, you can check your devices in the list.", [
      {text: 'OK', onPress: () => {}},
    ]);
  }, [])

  const closeModal = () => {
    setModalVisible(!modalVisible);
    setSelectedDevice(undefined)
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.spaceBetween}/>
        <ScrollView style={styles.scrollview}>
          <Text style={styles.headerTitle}>BLE Scanner</Text>
          <Text style={styles.subTitle}>{`${(filteredNearbyDevice ?? []).length} devices found`}</Text>
          <View>
            <TextInput
              style={styles.searchInput}
              onChangeText={setKeyword}
              value={keyword}
              placeholder="Search..."
              placeholderTextColor={'#888888'}
            />
          </View>

          { filteredNearbyDevice && filteredNearbyDevice.map((d: BluetoothService.BLEDeviceData) => {
            return (
              <TouchableOpacity onPress={() => {
                setSelectedDevice(d)
                setModalVisible(true)
              }} style={styles.cellContainer} key={Platform.OS == 'android' ? d.address : d.uuid}>
                <Text style={styles.cellTextRSSI}>{`${d.rssi}\ndBm`}</Text>
                <View>
                  <Text style={styles.cellTextName}>{d.name}</Text>
                  <Text style={styles.cellTextAddress}>{d.address}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          {
            (filteredNearbyDevice ?? []).length == 0 && (
              <Text style={styles.emptyStateText}>No Data</Text>
            )
          }
          <Modal
            animationType="fade"
            visible={modalVisible}
            transparent={true}
            onRequestClose={closeModal}>
            <View style={styles.centeredView}>
              <View style={styles.modalContainer}>
                <View style={styles.modalCell}>
                  <Text style={styles.cellLabel}>DEVICE NAME</Text>
                  <Text style={styles.cellLabelValue}>{selectedDevice?.name ?? '-'}</Text>
                </View>
                <View style={styles.modalCell}>
                  <Text style={styles.cellLabel}>DEVICE ADDRESS</Text>
                  <Text style={styles.cellLabelValue}>{selectedDevice?.address ?? '-'}</Text>
                </View>
                <View style={styles.modalCell}>
                  <Text style={styles.cellLabel}>RSSI</Text>
                  <Text style={styles.cellLabelValue}>{`${selectedDevice?.rssi ?? '-'} dBm`}</Text>
                </View>
                <View style={styles.modalCell}>
                  <Text style={styles.cellLabel}>Tx Power Level</Text>
                  <Text style={styles.cellLabelValue}>{`${selectedDevice?.txPowerLevel ?? '-'} dBm`}</Text>
                </View>
                <View style={styles.modalCell}>
                  <Text style={styles.cellLabel}>Advertise Flags</Text>
                  <Text style={styles.cellLabelValue}>{selectedDevice?.advertiseFlags ?? '-'}</Text>
                </View>
                <View style={styles.divider}/>
                <View style={styles.modalCellColumn}>
                  <Text style={styles.cellLabel}>UUID</Text>
                  <Text style={styles.cellLabelValue}>{selectedDevice?.uuid ?? '-'}</Text>
                </View>
                <View style={styles.modalCellColumn}>
                  <Text style={styles.cellLabel}>SERVICE UUIDs</Text>
                  { 
                    selectedDevice 
                    && (selectedDevice?.serviceUuids ?? []).length > 0 
                    && selectedDevice.serviceUuids?.map((uuid: string) => (
                      <Text style={styles.cellLabelValue} key={uuid}>{uuid}</Text>
                    ))
                  }
                  {
                    selectedDevice?.serviceUuids == undefined && (<Text style={styles.cellLabelValue}>No Service UUIDs</Text>)
                  }
                </View>
                <View style={styles.modalCellColumn}>
                  <Text style={styles.cellLabel}>MANUFACTURER SPECIFIC DATA</Text>
                  { 
                    selectedDevice 
                    && (selectedDevice?.manufacturerSpecificData ?? []).length > 0 
                    && selectedDevice.manufacturerSpecificData?.map((data: string) => (
                      <View style={styles.modalCell} key={data}>
                        <Text style={styles.cellLabel}>{data.split('=').at(0)}</Text>
                        <Text style={styles.cellLabelValue}>{data.split('=').at(1)}</Text>
                      </View>
                    ))
                  }
                  {
                    selectedDevice?.manufacturerSpecificData == undefined && (<Text style={styles.cellLabelValue}>No Service UUIDs</Text>)
                  }
                </View>
                <Pressable
                  style={styles.buttonHideModal}
                  onPress={closeModal}>
                  <Text style={styles.buttonTitle}>Hide Modal</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        </ScrollView>

        {
          (isFetching) ? (
            <TouchableOpacity
              style={styles.buttonStop}
              onPress={ stopScanBLEDevice }
            >
              <Text style={styles.buttonTitle}>STOP SCANNING</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.buttonStart}
              onPress={ scanBLEDevice }
            >
              <Text style={styles.buttonTitle}>SCAN</Text>
            </TouchableOpacity>
          )
        }
      <SafeAreaView />
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    borderBottomColor: 'black',
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: 8
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    margin: 20,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 35,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalCell: {
    flexDirection: 'row',
  },
  modalCellColumn: {
    flexDirection: 'column',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollview: {
    margin: normalize(16),
    flex: 1
  },
  searchInput: {
    fontSize: normalize(20),
    marginVertical: normalize(20),
    borderWidth: 1,
    borderRadius: normalize(8),
    color: "#222222",
    padding: normalize(10),
  },
  headerTitle: {
    fontSize: normalize(20),
    fontWeight: 500,
    color: '#222222',
    textAlign: 'center'
  },
  emptyStateText: {
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: normalize(24),
    fontWeight: 500,
    color: '#888888',
  },
  subTitle: {
    fontSize: normalize(15),
    fontWeight: 400,
    color: '#888888',
    textAlign: 'center'
  },
  cellContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFE9D5',
    marginVertical: normalize(4),
    padding: normalize(16),
    borderRadius: normalize(8)
  },
  cellTextRSSI: {
    backgroundColor: "#71BBB2",
    color: '#FFFFFF',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: normalize(20),
    width: Dimensions.get('screen').width * 0.2,
    borderRadius: normalize(8),
    padding: normalize(8),
    marginRight: normalize(8),
    fontWeight: 700,
  },
  cellLabel: {
    color: '#888888',
    fontSize: normalize(16),
    fontWeight: 400,
    marginRight: normalize(8)
  },
  cellLabelValue: {
    color: '#222222',
    fontSize: normalize(16),
    fontWeight: 500,
  },
  cellTextName: {
    color: '#222222',
    fontSize: normalize(16),
    fontWeight: 400,
    marginBottom: normalize(8)
  },
  cellTextAddress: {
    color: '#888888',
    fontSize: normalize(14),
  },
  spaceBetween: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  buttonHideModal: {
    marginTop: normalize(32),
    justifyContent: 'center',
    backgroundColor: '#497D74',
    alignSelf: 'stretch',
    alignItems: 'center',
    padding: normalize(4),
    borderRadius: normalize(30),
  },
  buttonStart: {
    bottom: normalize(16),
    marginHorizontal: normalize(16),
    backgroundColor: '#27445D',
    borderRadius: normalize(30),
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '3px 3px 4px #888888',
  },
  buttonTitle: {
    fontSize: normalize(24),
    padding: normalize(8),
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  buttonStop: {
    bottom: normalize(16),
    marginHorizontal: normalize(16),
    backgroundColor: '#FF0000',
    borderRadius: normalize(30),
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '3px 3px 4px #888888',
  }
});

export default App;
