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

const items = [
  { title: 'Hello Swiper', css: styles.slide1 },
  { title: 'Beautiful', css: styles.slide2 },
  { title: 'And simple', css: styles.slide3 },
];

export default () => (
  <Swiper
    style={styles.wrapper}
    paginationStyle={{ container: { backgroundColor: 'transparent' } }}
    paginationLeft={''}
    paginationRight={''}
    smoothTransition
    loop
  >
    {items.map(item => (
      <View key={Math.random()} style={item.css}>
        <Text style={styles.text}>{item.title}</Text>
      </View>
      ))}
  </Swiper>
  );
