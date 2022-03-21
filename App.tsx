/**
 * This file is part of fwew-react.
 * fwew-react: Fwew Na'vi Dictionary app written using React Native
 * Copyright (C) 2022 Corey Scheideman <corscheid@gmail.com>
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
import 'react-native-gesture-handler'

import { SettingsStore, StateStore } from './context'

import DrawerNavigator from './components/drawer-navigator'
import { NavigationContainer } from '@react-navigation/native'
import React from 'react'
import GlobalStyle from './lib/global-style'

// Top level main component
const App = (): JSX.Element => (
  <React.Fragment>
    <GlobalStyle />
    <SettingsStore>
      <StateStore>
        <NavigationContainer>
          <DrawerNavigator />
        </NavigationContainer>
      </StateStore>
    </SettingsStore>
  </React.Fragment>
)

export default App
