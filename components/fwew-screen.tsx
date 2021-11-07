/**
 * This file is part of fwew-react.
 * fwew-react: Fwew Na'vi Dictionary app written using React Native
 * Copyright (C) 2021  Corey Scheideman <corscheid@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import React, {
  Fragment,
  useContext,
  useEffect,
  useLayoutEffect,
  useState
} from 'react'
import axios, { AxiosError, AxiosResponse } from 'axios'

import ActionBar from './action-bar'
import EntryModalContent from './entry-modal-content'
import { FwewError } from '../lib/interfaces/fwew-error'
import If from './if'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { Modal } from 'react-native-paper'
import ResultCount from './result-count'
import { SettingsContext } from '../context'
import { Word } from '../lib/interfaces/word'
import WordList from './word-list'
import { apiRoot } from '../lib/settings'
import colors from '../lib/colors'
import { languageNames } from '../lib/i18n'
import { ui } from '../lib/i18n'
import { useOrientation } from '../lib/hooks/useOrientation'

/**
 * FwewScreen Component
 *
 * Screen where the user can search for specific word(s)
 */
function FwewScreen({ navigation }): JSX.Element {
  const [isLoading, setIsLoading] = useState(true)
  const [text, setText] = useState('')
  const [data, setData] = useState([] as Word[])
  const [err, setErr] = useState({} as FwewError)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState({} as Word)
  const { settingsGlobal, settingsFwew, onUpdateSettingsFwew } = useContext(
    SettingsContext
  )
  const { isReverseEnabled } = settingsFwew
  const { languageCodeUI, languageCode } = settingsGlobal
  const strings = ui[languageCodeUI].fwewScreen
  const languageUIName = languageNames[languageCode]
  const orientation = useOrientation()

  // fetch data and re-render after this component is mounted to the DOM and rendered in initial loading state
  useEffect(() => {
    fetchData(`${apiRoot}/list/`)
  }, [])

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => {
        const windowWidth = Dimensions.get('window').width
        return (
          <View>
            {/* status bar */}
            <SafeAreaView style={styles.safeStatusBar} />
            <StatusBar barStyle="light-content" />
            <ActionBar>
              <If condition={windowWidth > 480}>
                <View style={{ flex: 0.5 }}></View>
              </If>
              <View style={styles.parent}>
                {/* search bar */}
                <TextInput
                  onChangeText={searchData}
                  placeholder={getInputPlaceholderText()}
                  autoCapitalize={'none'}
                  autoCorrect={false}
                  style={styles.input}
                  clearButtonMode="always"
                  value={text}
                />
                {/* search bar clear input button */}
                <If condition={Platform.OS !== 'ios' && !!text}>
                  <TouchableOpacity
                    style={styles.closeButtonParent}
                    onPress={() => searchData('')}
                  >
                    <MaterialIcons
                      style={styles.closeButton}
                      name="cancel"
                      size={18}
                      color={'#fff'}
                    />
                  </TouchableOpacity>
                </If>
              </View>
              <If condition={windowWidth > 480}>
                <View style={{ flex: 0.5 }}></View>
              </If>
              {/* Fwew Search direction toggle */}
              <TouchableOpacity onPress={toggleReverse}>
                <MaterialIcons
                  name={
                    isReverseEnabled ? 'swap-horizontal-circle' : 'swap-horiz'
                  }
                  size={36}
                  color={colors.actionBarIconFill}
                />
              </TouchableOpacity>
            </ActionBar>
          </View>
        )
      }
    })
  }, [navigation, isReverseEnabled, text, strings, languageUIName, orientation])

  // toggles info modal visible when user taps a list entry or modal backdrop
  const toggleModal = (item: Word): void => {
    setIsModalVisible(!isModalVisible)
    setSelectedItem(item)
  }

  // calculates API endpoint for data fetching
  const getEndpoint = (text?: string): string => {
    if (!text) {
      return `${apiRoot}/list/`
    }
    const { languageCode } = settingsGlobal
    return isReverseEnabled
      ? `${apiRoot}/fwew/r/${languageCode}/${text}`
      : `${apiRoot}/fwew/${text}`
  }

  // called when the user pulls down on the word list after it has rendered
  const onRefresh = () => {
    setData([])
    fetchData(getEndpoint(text))
  }

  // fetches Na'vi word data from the Fwew API and updates the state data accordingly
  const fetchData = (endpoint: string): void => {
    setIsLoading(true)
    axios
      .get<Word[]>(encodeURI(endpoint))
      .then((response: AxiosResponse<Word[]>) => {
        setData(response.data)
        setIsLoading(false)
      })
      .catch((e) => {
        if (axios.isAxiosError(e)) {
          const serverError = e as AxiosError<FwewError>
          setErr(serverError.response.data)
          setData([])
          setIsLoading(false)
        }
      })
  }

  // called whenever the user types or modifies text in the text input of the action bar / app bar
  const searchData = (text: string): void => {
    setText(text)
    if (text === '') {
      fetchData(`${apiRoot}/list/`)
    } else {
      fetchData(getEndpoint(text))
    }
  }

  // called whenever the user clicks the swap button or toggles the switch in Fwew Settings to reverse search direction
  const toggleReverse = (): void => {
    const newIsReverseEnabled = !isReverseEnabled
    onUpdateSettingsFwew({
      ...settingsFwew,
      isReverseEnabled: newIsReverseEnabled
    })
    if (text === '') return
    if (newIsReverseEnabled) {
      fetchData(`${apiRoot}/fwew/r/${languageCode}/${text}`)
    } else {
      fetchData(`${apiRoot}/fwew/${text}`)
    }
  }

  // sets the search bar placeholder text depending on the currently selected tab / screen
  const getInputPlaceholderText = (): string => {
    return `${strings.search} ${isReverseEnabled ? languageUIName : "Na'vi"}...`
  }

  return (
    <Fragment>
      {/* main content */}
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.mainView}>
          <If condition={isLoading}>
            <ActivityIndicator
              style={styles.activityIndicator}
              size={'large'}
              color={colors.accent}
            />
          </If>
          <If condition={!isLoading}>
            <ResultCount data={data} />
            <WordList
              data={data}
              err={err}
              text={text}
              isLoading={isLoading}
              onRefresh={onRefresh}
              toggleModal={toggleModal}
              posFilterEnabled={true}
            />
          </If>
          {/* word information modal when user taps an entry in the list */}
          <Modal
            visible={isModalVisible}
            onDismiss={() => toggleModal(selectedItem)}
            contentContainerStyle={styles.modalContainerStyle}
          >
            <EntryModalContent entry={selectedItem} />
          </Modal>
        </View>
      </SafeAreaView>
    </Fragment>
  )
}

const styles = StyleSheet.create({
  safeStatusBar: {
    flex: 0,
    backgroundColor: colors.secondary
  },
  safeContainer: {
    flex: 1,
    backgroundColor: colors.primary
  },
  mainView: {
    flex: 1,
    backgroundColor: colors.screenBackground
  },
  parent: {
    flex: 1,
    borderColor: colors.secondary,
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginRight: 8
  },
  input: {
    height: 40,
    flex: 1,
    paddingLeft: 8,
    marginLeft: 8,
    marginRight: 8
  },
  closeButton: {
    color: colors.inputCloseButton,
    height: 18,
    width: 18,
    marginRight: 8
  },
  closeButtonParent: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5
  },
  activityIndicator: {
    marginTop: 16
  },
  resultCount: {
    alignSelf: 'center',
    marginTop: 16,
    fontSize: 16
  },
  modalContainerStyle: {
    padding: 16,
    shadowOpacity: 0
  }
})

export default FwewScreen
