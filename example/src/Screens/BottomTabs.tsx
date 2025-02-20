import { useActionSheet } from '@expo/react-native-action-sheet';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  type BottomTabScreenProps,
  createBottomTabNavigator,
  useBottomTabBarHeight,
} from '@react-navigation/bottom-tabs';
import {
  HeaderBackButton,
  HeaderButton,
  PlatformPressable,
  useHeaderHeight,
} from '@react-navigation/elements';
import {
  type NavigatorScreenParams,
  type PathConfigMap,
  useIsFocused,
} from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

import { Albums } from '../Shared/Albums';
import { Chat } from '../Shared/Chat';
import { Contacts } from '../Shared/Contacts';
import { SimpleStack, type SimpleStackParams } from './SimpleStack';

const getTabBarIcon =
  (name: React.ComponentProps<typeof MaterialCommunityIcons>['name']) =>
  ({ color, size }: { color: string; size: number }) => (
    <MaterialCommunityIcons name={name} color={color} size={size} />
  );

export type BottomTabParams = {
  TabStack: NavigatorScreenParams<SimpleStackParams>;
  TabAlbums: undefined;
  TabContacts: undefined;
  TabChat: undefined;
};

const linking: PathConfigMap<BottomTabParams> = {
  TabStack: {
    path: 'stack',
    screens: SimpleStack.linking,
  },
  TabAlbums: 'albums',
  TabContacts: 'contacts',
  TabChat: 'chat',
};

const AlbumsScreen = () => {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const isFocused = useIsFocused();

  return (
    <>
      {isFocused && Platform.OS === 'android' && (
        <StatusBar barStyle="light-content" />
      )}
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingBottom: tabBarHeight,
        }}
      >
        <Albums scrollEnabled={false} />
      </ScrollView>
    </>
  );
};

const Tab = createBottomTabNavigator<BottomTabParams>();

const animations = ['none', 'fade', 'shift'] as const;

export function BottomTabs() {
  const { showActionSheetWithOptions } = useActionSheet();

  const dimensions = useWindowDimensions();

  const [animation, setAnimation] =
    React.useState<(typeof animations)[number]>('none');
  const [isCompact, setIsCompact] = React.useState(false);

  const isLargeScreen = dimensions.width >= 1024;

  return (
    <>
      <Tab.Navigator
        screenOptions={({
          navigation,
        }: BottomTabScreenProps<BottomTabParams>) => ({
          headerLeft: (props) => (
            <HeaderBackButton {...props} onPress={navigation.goBack} />
          ),
          headerRight: ({ tintColor }) => (
            <HeaderButton
              onPress={() => {
                showActionSheetWithOptions(
                  {
                    options: animations.map((option) => {
                      if (option === animation) {
                        return `${option} (current)`;
                      }

                      return option;
                    }),
                  },
                  (index) => {
                    if (index != null) {
                      setAnimation(animations[index]);
                    }
                  }
                );
              }}
            >
              <MaterialCommunityIcons
                name={animation === 'none' ? 'heart-outline' : 'heart'}
                size={24}
                color={tintColor}
              />
            </HeaderButton>
          ),
          tabBarPosition: isLargeScreen ? 'left' : 'bottom',
          tabBarLabelPosition:
            isLargeScreen && isCompact ? 'below-icon' : undefined,
          animation,
        })}
      >
        <Tab.Screen
          name="TabStack"
          component={SimpleStack}
          options={{
            title: 'Article',
            headerShown: false,
            tabBarIcon: getTabBarIcon('file-document'),
          }}
        />
        <Tab.Screen
          name="TabChat"
          component={Chat}
          options={{
            tabBarLabel: 'Chat',
            tabBarIcon: getTabBarIcon('message-reply'),
            tabBarBadge: 2,
          }}
        />
        <Tab.Screen
          name="TabContacts"
          component={Contacts}
          options={{
            title: 'Contacts',
            tabBarIcon: getTabBarIcon('contacts'),
          }}
        />
        <Tab.Screen
          name="TabAlbums"
          component={AlbumsScreen}
          options={{
            title: 'Albums',
            headerTintColor: '#fff',
            headerTransparent: true,
            headerBackground: () => (
              <BlurView
                tint="dark"
                intensity={100}
                style={StyleSheet.absoluteFill}
              />
            ),
            tabBarIcon: getTabBarIcon('image-album'),
            tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
            tabBarActiveTintColor: '#fff',
            tabBarStyle: {
              position: isLargeScreen ? undefined : 'absolute',
              borderColor: 'rgba(0, 0, 0, .2)',
            },
            tabBarBackground: () => (
              <>
                {isLargeScreen && (
                  <Image
                    source={require('../../assets/album-art-03.jpg')}
                    resizeMode="cover"
                    style={{
                      ...StyleSheet.absoluteFillObject,
                      // Override default size of the image
                      height: undefined,
                      width: undefined,
                    }}
                  />
                )}
                <BlurView
                  tint="dark"
                  intensity={100}
                  style={{
                    ...StyleSheet.absoluteFillObject,
                    right: isLargeScreen
                      ? // Offset for right border of the sidebar
                        -StyleSheet.hairlineWidth
                      : 0,
                  }}
                />
              </>
            ),
          }}
        />
      </Tab.Navigator>
      {isLargeScreen ? (
        <PlatformPressable
          onPress={() => setIsCompact(!isCompact)}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            padding: 16,
          }}
        >
          <MaterialCommunityIcons
            name={isCompact ? 'chevron-double-right' : 'chevron-double-left'}
            size={24}
            color="black"
          />
        </PlatformPressable>
      ) : null}
    </>
  );
}

BottomTabs.title = 'Bottom Tabs';
BottomTabs.linking = linking;
