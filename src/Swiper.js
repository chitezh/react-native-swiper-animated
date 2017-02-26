import React, { Component, PropTypes } from 'react';

import {
  StyleSheet,
  View,
  Text,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  BackAndroid,
  TouchableOpacity,
} from 'react-native';
import clamp from 'clamp';

import uuid from 'react-native-uuid';
import { COLOR, ThemeProvider, Toolbar } from 'react-native-material-ui';

let SWIPE_THRESHOLD = 120;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
    backgroundColor: 'transparent',
  },
  card: {
    flex: 1,
  },
  dot: {
    height: 5,
    width: 5,
    borderRadius: 5,
    marginLeft: 3,
    marginRight: 3,
  },
  dotContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});


const { height: deviceHeight } = Dimensions.get('window');

const uiTheme = {
  palette: {
    primaryColor: COLOR.green500,
  },
  toolbar: {
    container: {
      height: 50,
    },
  },
};

export default class SwiperAnimated extends Component {
  static propTypes = {
    children: PropTypes.array,
    index: PropTypes.number,
    style: PropTypes.any,
    loop: PropTypes.bool,
    swiper: PropTypes.bool,
    swiperThreshold: PropTypes.number,
    allowGestureTermination: PropTypes.bool,
    stack: PropTypes.bool,
    scaleOthers: PropTypes.bool,
    stackOffsetY: PropTypes.number,
    stackDepth: PropTypes.number,
    onClick: PropTypes.func,
    onRightSwipe: PropTypes.func,
    onLeftSwipe: PropTypes.func,
    renderCard: PropTypes.func,
    onRemoveCard: PropTypes.func,
    dragY: PropTypes.bool,
    smoothTransition: PropTypes.bool,
    tapToNext: PropTypes.bool,
    dragDownToBack: PropTypes.bool,
    backPressToBack: PropTypes.bool,
    showPagination: PropTypes.bool,
    paginationStyle: PropTypes.any,
    paginationLeft: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
    paginationRight: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
    onPaginationLeftPress: PropTypes.func,
    onPaginationRightPress: PropTypes.func,
    paginationDotColor: PropTypes.string,
    paginationActiveDotColor: PropTypes.string,
    onFinish: PropTypes.func,
  };

  static defaultProps = {
    children: [],
    index: 0,
    loop: false,
    swiper: true,
    swiperThreshold: null,
    allowGestureTermination: false,
    stack: false,
    scaleOthers: true,
    stackOffsetY: 3,
    stackDepth: 5,
    onClick: () => {
    },
    onRightSwipe: () => {
    },
    onLeftSwipe: () => {
    },
    onRemoveCard: () => {
    },
    renderCard: null,
    style: styles.container,
    dragY: true,
    smoothTransition: false,
    tapToNext: false,
    dragDownToBack: false,
    backPressToBack: true,
    showPagination: true,
    paginationStyle: { container: { paddingLeft: 10, paddingRight: 10 } },
    paginationLeft: <Text>HOME</Text>,
    paginationRight: <Text>SHARE</Text>,
    onPaginationLeftPress: () => {
    },
    onPaginationRightPress: () => {
    },
    paginationDotColor: '#C5C5C5',
    paginationActiveDotColor: '#4D4D4E',
    onFinish: () => {
    },
  };

  constructor(props) {
    super(props);

    const { children, swiperThreshold, index } = this.props;

    SWIPE_THRESHOLD = swiperThreshold || SWIPE_THRESHOLD;

    this.currentIndex = {};

    this.guid = uuid();
    if (!this.currentIndex[this.guid]) this.currentIndex[this.guid] = index;

    this.state = {
      pan: new Animated.ValueXY(),
      pan2: new Animated.ValueXY(),
      enter: new Animated.Value(0.9),
      fadeAnim: new Animated.Value(0.8),
      cards: [...children],
      card: children[this.currentIndex[this.guid]],
      card2: children[this.currentIndex[this.guid] + 1],
    };

    this.lastX = 0;
    this.lastY = 0;

    this.cardAnimation = null;
  }

  componentWillMount() {
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponderCapture: this.handleStartShouldSetPanResponder,
      onMoveShouldSetPanResponderCapture: this.handleMoveShouldSetPanResponder,
      onPanResponderGrant: this.handlePanResponderGrant,
      onPanResponderTerminationRequest: () => this.props.allowGestureTermination,
      onPanResponderMove: this.handlePanResponderMove(),
      onPanResponderRelease: this.handlePanResponderEnd,
    });
  }

  componentDidMount() {
    this.isComponentMounted = true;
    this.animateEntrance();
    if (Platform.OS === 'android' && this.props.backPressToBack) {
      BackAndroid.addEventListener('hardwareBackPress', this.handleBackPress);
    }
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
    if (Platform.OS === 'android' && this.props.backPressToBack) {
      BackAndroid.removeEventListener('hardwareBackPress');
    }
  }

  /**
   * Returns current card object
   */
  getCurrentCard = () => this.state.cards[this.currentIndex[this.guid]];

  handleStartShouldSetPanResponder = (e, gestureState) => {
    this.lastX = gestureState.moveX;
    this.lastY = gestureState.moveY;
    return false;
  }

  handleMoveShouldSetPanResponder = (e, gestureState) =>
  Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;

  handlePanResponderGrant = () => {
    const { pan } = this.state;
    pan.setOffset({ x: pan.x._value, y: pan.y._value });
    pan.setValue({ x: 0, y: 0 });
  };

  handlePanResponderMove = () => Animated.event([
    null, { dx: this.state.pan.x, dy: this.props.dragY ? this.state.pan.y : new Animated.Value(0) },
  ]);

  handlePanResponderEnd = (e, { vx, vy, dx, dy }) => {
    const { pan, card } = this.state;
    pan.flattenOffset();

    const {
      onRightSwipe,
      onLeftSwipe,
      onRemoveCard,
      onClick,
      tapToNext,
      stack,
      dragDownToBack,
    } = this.props;


    let velocity;
    if (vx >= 0) {
      velocity = clamp(vx, 3, 5);
    } else if (vx < 0) {
      velocity = clamp(vx * -1, 3, 5) * -1;
    }
    if ((dx === 0) && (dy === 0)) {
      onClick(card);
      if (tapToNext) this.advanceState(velocity, vy, true);
    }

    if (dragDownToBack && Math.abs(dx) < 20 && dy > SWIPE_THRESHOLD - 30) {
      this.advanceState(velocity, vy);
      return;
    }

    const panX = Math.abs(pan.x._value);
    const panY = Math.abs(pan.y._value);

    if ((!isNaN(panY) && panX > SWIPE_THRESHOLD) || (!isNaN(panY) && panY > SWIPE_THRESHOLD)) {
      if (stack) {
        // if stack, any direction removes card
        this.advanceState(velocity, vy, true);
        return;
      }

      if (pan.x._value > 0) {
        onRightSwipe(card);
        this.advanceState(velocity, vy, true);
      } else {
        onLeftSwipe(card);
        this.advanceState(velocity, vy);
      }
      onRemoveCard(this.currentIndex[this.guid]);
    } else {
      this.resetPan();
    }
  };

  handleDirection = (isNext) => {
    if (!this.isComponentMounted) { return; }

    this.resetState();

    if (this.props.stack) {
      if ((this.props.dragDownToBack || this.props.backPressToBack) && !isNext) {
        if (this.currentIndex[this.guid] > 0) {
          this.currentIndex[this.guid] -= 1;

          this.setState({
            card: this.state.cards[this.currentIndex[this.guid]],
          });
        }
      } else {
        const total = this.state.cards.length;

        if (this.currentIndex[this.guid] < total - 1) {
          this.currentIndex[this.guid] += 1;

          this.setState({
            card: this.state.cards[this.currentIndex[this.guid]],
          });
        } else if (this.props.loop) {
          this.currentIndex[this.guid] = 0;

          this.setState({
            card: this.state.cards[0],
          });
        } else {
          this.props.onFinish();
        }
      }
    } else if (isNext) this.goToNextCard();
    else this.goToPrevCard();
  }

  advanceState = (velocity, vy, isNext) => {
    const { pan } = this.state;
    const { smoothTransition } = this.props;

    if (smoothTransition) {
      this.handleDirection(isNext);
    } else {
      this.cardAnimation = Animated.decay(pan, {
        velocity: { x: velocity, y: vy },
        deceleration: 0.98,
      });

      this.cardAnimation.start((status) => {
        if (status.finished) {
          this.handleDirection(isNext);
        } else this.resetState();

        this.cardAnimation = null;
      });
    }
  }

  goToNextCard = () => {
    const total = this.state.cards.length;
    if (this.currentIndex[this.guid] < total - 1) {
      this.currentIndex[this.guid] += 1;
      this.setState({
        card: this.state.cards[this.currentIndex[this.guid]],
      });
    } else if (this.currentIndex[this.guid] === total - 1) {
      if (this.props.loop) {
        this.currentIndex[this.guid] = 0;

        this.setState({
          card: this.state.cards[this.currentIndex[this.guid]],
        });
      } else {
        this.props.onFinish();
      }
    }
  }

  goToPrevCard = () => {
    this.currentIndex[this.guid] -= 1;

    if (this.currentIndex[this.guid] < 0) {
      this.currentIndex[this.guid] = 0;
    }

    this.setState({
      card: this.state.cards[this.currentIndex[this.guid]],
    });
  }

  animateEntrance = () => {
    Animated.timing(
      this.state.fadeAnim,
      { toValue: 1 },
    ).start();

    Animated.spring(
      this.state.enter,
      { toValue: 1, friction: 8 },
    ).start();
  }

  resetPan = () => {
    Animated.spring(this.state.pan, {
      toValue: { x: 0, y: 0 },
      friction: 4,
    }).start();
  }

  resetState = () => {
    const { stack, smoothTransition } = this.props;

    this.state.pan.setValue({ x: 0, y: 0 });
    this.state.enter.setValue(stack && smoothTransition ? 0.98 : 0);
    this.state.fadeAnim.setValue(0.8);
    this.animateEntrance();
  }

  forceLeftSwipe = () => {
    this.cardAnimation = Animated.timing(this.state.pan, {
      toValue: { x: -500, y: 0 },
    })
    .start((status) => {
      this.resetState();
      if (status.finished) this.handleDirection(false);

      this.cardAnimation = null;
    });
    this.props.onRemoveCard(this.currentIndex[this.guid]);
  }

  forceRightSwipe = () => {
    this.cardAnimation = Animated.timing(this.state.pan, {
      toValue: { x: 500, y: 0 },
    }).start((status) => {
      this.resetState();
      if (status.finished) this.handleDirection(true);

      this.cardAnimation = null;
    });
    this.props.onRemoveCard(this.currentIndex[this.guid]);
  }

  handleBackPress = () => {
    if (this.currentIndex[this.guid] === 0) {
      return false;
    }
    this.forceLeftSwipe();
    return true;
  }

  calcOffsetY = (index, y) => y * index;

  calcScale = reversedIndex => 1 - ((reversedIndex) * 0.005);

  jumpToIndex = (index) => {
    this.currentIndex[this.guid] = index;

    this.setState({
      card: this.state.cards[this.currentIndex[this.guid]],
    });
  }

  renderPagination = () => {
    const total = this.state.cards.length;
    const index = this.currentIndex[this.guid];
    const {
      paginationLeft,
      paginationRight, onPaginationLeftPress,
      onPaginationRightPress,
      paginationStyle,
      paginationDotColor,
      paginationActiveDotColor,
    } = this.props;

    const dots = [];
    for (let i = 0; i < total; i += 1) {
      dots.push(
        <TouchableOpacity
          key={uuid()}
          onPress={() => this.jumpToIndex(i)}
          style={[styles.dot, {
            backgroundColor: paginationDotColor || '#C5C5C5',
          },
            index >= i ? { backgroundColor: paginationActiveDotColor || '#4D4D4E' } : null]}
        />,
      );
    }

    return (
      <Toolbar
        style={paginationStyle}
        leftElement={paginationLeft}
        onLeftElementPress={onPaginationLeftPress}
        onRightElementPress={onPaginationRightPress}
        rightElement={paginationRight}
        centerElement={<View style={styles.dotContainer}>{dots}</View>}
      />
    );
  }

  /**
   * Renders the cards as a stack with props.stackDepth cards deep.
   */
  renderStack = () => {
    const { swiper, stackOffsetY: offsetY, smoothTransition, stackDepth, scaleOthers } = this.props;
    const { cards, pan, enter } = this.state;

    const reversedCards = cards
        .slice(this.currentIndex[this.guid], this.currentIndex[this.guid] + stackDepth)
        .reverse();

    const count = reversedCards.length;

    const cardStack = reversedCards.map((card, i) => {
      // calculate transforms depending on the card index (reversed style)
      const cardOffsetY = this.calcOffsetY(count - i - 1, offsetY);
      const cardScaleX = this.calcScale(count - i - 1);
      // the end position equals the position of the card above (=> reduce index)
      const cardOffsetYEnd = this.calcOffsetY(count - i - 2, offsetY);
      const cardScaleEnd = this.calcScale(count - i - 2);

      let translateY = 0;
      let translateX = 0;
      let rotate = '0deg';
      let panHandlers = {};
      let scaleX = 1;
      let scale = 1;
      let opacity = 1;

      if (i === 0 && count > stackDepth) {
        /* ===============================================================================
        last card!
        hide it behind the others at first, show it after transforms
        dont hide if there are not enough cards anymore
        =============================================================================== */
        // to hide the card, set the offsetY the samle value as the card above / before
        const _cardOffsetY = this.calcOffsetY(count - 2, offsetY);
        translateY = Animated.add(pan.y, pan.x).interpolate({
          inputRange: [-120, 0, 120],
          outputRange: [cardOffsetYEnd, _cardOffsetY, cardOffsetYEnd],
          extrapolate: 'clamp',
        });
        scaleX = Animated.add(pan.y, pan.x).interpolate({
          inputRange: [-120, 0, 120],
          outputRange: [cardScaleEnd, cardScaleX, cardScaleEnd],
          extrapolate: 'clamp',
        });
      } else if (i === count - 1) {
        /* ===============================================================================
        first card!
        add panHandlers and other transforms
        =============================================================================== */
        rotate = pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ['-10deg', '0deg', '10deg'] });
        opacity = smoothTransition ?
              1 : pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: [0.9, 1, 0.9] });
        translateY = pan.y;
        translateX = pan.x;
        panHandlers = swiper ? this.panResponder.panHandlers : {};
        scale = enter;
      } else {
        /* ===============================================================================
        cards between first and last!
        =============================================================================== */
        translateY = Animated.add(pan.y, pan.x).interpolate({
          inputRange: [-120, 0, 120],
          outputRange: [cardOffsetYEnd, cardOffsetY, cardOffsetYEnd],
          extrapolate: 'clamp',
        });
        scaleX = Animated.add(pan.y, pan.x).interpolate({
          inputRange: [-120, 0, 120],
          outputRange: [cardScaleEnd, cardScaleX, cardScaleEnd],
          extrapolate: 'clamp',
        });
      }

      const animatedCardStyles = {
        position: 'absolute',
        top: 0,
        left: 10,
        right: 10,
        borderRadius: 10,
        height: deviceHeight - 100 - offsetY,
        opacity,
        transform: [
          { translateY },
          { rotate },
          { translateX },
          { scaleX: scaleOthers ? scaleX : 1 },
          { scale },
        ],
      };

      return (<Animated.View
        key={uuid()}
        style={animatedCardStyles}
        {...panHandlers}
      >
        {card}
      </Animated.View>);
    });

    return (
      <View style={{ position: 'relative', flexDirection: 'column' }}>
        {cardStack}
      </View>
    );
  }

  renderCard = () => {
    const { pan, enter } = this.state;
    const { swiper, renderCard, smoothTransition } = this.props;
    const [translateX, translateY] = [pan.x, pan.y];

    const rotate = pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ['-30deg', '0deg', '30deg'] });
    const opacity = smoothTransition ?
      1 : pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: [0.5, 1, 0.5] });

    const scale = enter;

    const animatedCardStyles = {
      transform: [{ translateX }, { translateY }, { rotate }, { scale }],
      opacity,
    };

    const handler = swiper ? this.panResponder.panHandlers : {};

    return (
      <Animated.View
        key={uuid()}
        style={[styles.card, animatedCardStyles]}
        {...handler}
      >
        {renderCard ? renderCard(this.state.card) : this.state.card}
      </Animated.View>
    );
  }

  render() {
    const { stack, showPagination, style: propStyle } = this.props;

    return (
      <ThemeProvider uiTheme={uiTheme}>
        <View style={[styles.container, propStyle]}>
          {showPagination ? this.renderPagination() : null}
          {stack ? this.renderStack() : this.renderCard()}
        </View>
      </ThemeProvider>
    );
  }
}
