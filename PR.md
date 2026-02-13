# PR Title

```
fix(bottom-tabs): respect tabBarStyle display:'none' in native tab bar implementation
```

# PR Body

## Summary

The native bottom tabs implementation (`BottomTabViewNativeImpl`) does not respect
`tabBarStyle: { display: 'none' }` for hiding the tab bar on specific screens.

This is a common pattern used with `getFocusedRouteNameFromRoute` to hide the tab bar
when navigating to nested screens (as documented in
https://reactnavigation.org/docs/hiding-tabbar-in-screens/).

The JS/custom implementation (`BottomTabView`) handles this correctly, but the native
implementation only sets `tabBarHidden` when a custom `tabBar` prop is provided.

## Root Cause

In `BottomTabViewNativeImpl.tsx`, the `tabBarHidden` prop on `Tabs.Host` was only set
when a custom tab bar is provided:

```tsx
<Tabs.Host tabBarHidden={hasCustomTabBar} ... >
```

The `tabBarStyle` type also didn't include `display` — only `backgroundColor` and
`shadowColor` were declared.

## Fix

1. Added `display?: 'flex' | 'none'` to the `tabBarStyle` type in `types.tsx`
2. Read `display` from `currentOptions.tabBarStyle` in `BottomTabViewNativeImpl.tsx`
3. Passed it to `Tabs.Host`'s `tabBarHidden` prop

This is a 3-line change across 2 files.

## Usage Examples

### 1. Hide tab bar on a specific screen (static config)

The most common use case — hide the tab bar when a nested stack screen is focused:

```tsx
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tabs = createBottomTabNavigator();

function MyTabs() {
  return (
    <Tabs.Navigator implementation="native">
      <Tabs.Screen
        name="Home"
        component={HomeStack}
        options={({ route }) => ({
          tabBarStyle: {
            display: getFocusedRouteNameFromRoute(route) === 'Details'
              ? 'none'
              : 'flex',
          },
        })}
      />
      <Tabs.Screen name="Settings" component={SettingsScreen} />
    </Tabs.Navigator>
  );
}
```

### 2. Hide tab bar on all nested screens except the root

```tsx
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

function getTabBarStyle(route) {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'Feed';

  // Only show tab bar on the root screen of each stack
  const hideOnScreens = ['PostDetails', 'Comments', 'UserProfile'];

  return {
    display: hideOnScreens.includes(routeName) ? 'none' : 'flex',
  };
}

// In your navigator:
<Tabs.Screen
  name="Feed"
  component={FeedStack}
  options={({ route }) => ({
    tabBarStyle: getTabBarStyle(route),
  })}
/>
```

### 3. Conditionally hide tab bar based on state (e.g. fullscreen mode)

```tsx
function MyTabs() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <Tabs.Navigator
      implementation="native"
      screenOptions={{
        tabBarStyle: {
          display: isFullscreen ? 'none' : 'flex',
        },
      }}
    >
      <Tabs.Screen name="Player" component={PlayerScreen} />
      <Tabs.Screen name="Library" component={LibraryScreen} />
    </Tabs.Navigator>
  );
}
```

### 4. Hide tab bar globally via screenOptions

```tsx
<Tabs.Navigator
  implementation="native"
  screenOptions={{
    tabBarStyle: { display: 'none' },
  }}
>
  {/* All tabs will have the tab bar hidden */}
</Tabs.Navigator>
```

## Test Plan

1. Create a bottom tab navigator with `implementation: 'native'`
2. Nest a stack navigator inside one of the tabs
3. Set `tabBarStyle: { display: 'none' }` conditionally based on focused route
4. Navigate to a nested screen on Android
5. **Before fix:** Tab bar remains visible
6. **After fix:** Tab bar hides correctly

Also verified:
- `tabBarStyle: { display: 'flex' }` keeps the tab bar visible (no regression)
- Omitting `display` entirely keeps default behavior (tab bar visible)
- Works alongside `backgroundColor` and `shadowColor` in the same `tabBarStyle` object

## Checklist

- [x] Follows conventional commits
- [x] TypeScript passes (`yarn typecheck`)
- [x] ESLint passes (`yarn lint`)
- [x] Minimal, focused change
- [x] Type definition updated to include `display` property
