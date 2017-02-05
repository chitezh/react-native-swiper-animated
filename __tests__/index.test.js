import 'react-native';
import React from 'react';
// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';
import Swiper from '../src/Swiper';

describe('Swiper', () => {
  it('renders correctly', () => {
    renderer.create(<Swiper />);
  });
});
