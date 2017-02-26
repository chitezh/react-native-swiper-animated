# react-native-swiper-animated

Tinder like animations swiper for React Native

### Installation

```bash
$ npm i react-native-swiper-animated --save
```

### Shots

<img src="https://raw.githubusercontent.com/chitezh/react-native-swiper-animated/master/examples/shots/basic.gif" width="280">
<img src="https://raw.githubusercontent.com/chitezh/react-native-swiper-animated/master/examples/shots/stack.gif" width="280">
<img src="https://raw.githubusercontent.com/chitezh/react-native-swiper-animated/master/examples/shots/extended.gif" width="280">


Basic, Stack and Extended examples shots


### Basic Usage

```
import React from 'react';
import {
  Text,
  View,
} from 'react-native';
import Swiper from 'react-native-swiper-animated';

const styles = {
  wrapper: {
    backgroundColor: '#009688',
  },
  slide1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e91e63',
  },
  slide2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#673ab7',
  },
  slide3: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3f51b5',
  },
  text: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
};

export default () => <Swiper
  style={styles.wrapper}
  paginationStyle={{ container: { backgroundColor: 'transparent' } }}
  paginationLeft={''}
  paginationRight={''}
  smoothTransition
  loop
>
  <View style={styles.slide1}>
    <Text style={styles.text}>Hello Swiper</Text>
  </View>
  <View style={styles.slide2}>
    <Text style={styles.text}>Beautiful</Text>
  </View>
  <View style={styles.slide3}>
    <Text style={styles.text}>And simple</Text>
  </View>
</Swiper>;

```

### Examples

```bash
$ cd examples
$ npm i
$ react-native run-android
```

> Quick start with [examples](https://github.com/chitezh/react-native-swiper-animated/tree/master/examples/).


### Properties

#### Basic

| Prop  | Default  | Type | Description |
| :------------ |:---------------:| :---------------:| :-----|
| smoothTransition | false | `bool` | If `true`, Swiper will only transit with minimal animations
| loop | true | `bool` | Set to `false` to disable continuous loop mode. |
| index | 0 | `number` | Index number of initial slide. |
| stack | false | `bool` | Set to `true` to stack views |
| swiper | true | `bool` | Set to `false` to disable swiper (used when navigating using methods only)|

#### Custom basic style & content

| Prop  | Default  | Type | Description |
| :------------ |:---------------:| :---------------:| :-----|
| style | {...} | `style` | See default style in source. |
| swiperThreshold | 120 | `number` | Used to set swiper distance before transition |
| backPressToBack | true | `bool` | Set to `false` to disable previous card nagivation on back press   |
| stackOffsetY | 3 | `number` | Set vertical offset   |
| stackDepth | 5 | `number` | Set number of cards to display in card stack   |
| scaleOthers | true | `bool` | Set to `false` to disable scaling of cards below the top card |
[see more](https://github.com/chitezh/react-native-swiper-animated/blob/master/src/Swiper.js#L59)


### Methods

#### forceLeftSwipe()
Swiper to left

#### forceRightSwipe()
Swiper to right


### Development

```bash
$ cd examples
$ npm i
$ npm run watch
$ react-native run-android
```

## Contribution

- [@chitezh](mailto:ochu.kc@gmail.com) The main author.

## Questions

Feel free to [contact me](mailto:ochu.kc@gmail.com) or [create an issue](https://github.com/chitezh/react-native-swiper-animated/issues/new)

> Inspired by [leecade/Swiper](https://github.com/leecade/react-native-swiper/) and Tinder swiper by [@brentvatne](https://github.com/brentvatne)
