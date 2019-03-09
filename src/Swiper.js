import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
  StyleSheet,
  View,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  BackHandler,
  TouchableOpacity,
  TouchableNativeFeedback
} from 'react-native';
import clamp from 'clamp';

const has = Object.prototype.hasOwnProperty;

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
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPagination: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});

const { height: deviceHeight } = Dimensions.get('window');

export default class SwiperAnimated extends PureComponent {
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
    swipeThroughStack: PropTypes.bool,
    onFirstBackPressed: PropTypes.func,
    renderHeader: PropTypes.func,
    showPagination: PropTypes.bool,
    paginationDotColor: PropTypes.string,
    paginationActiveDotColor: PropTypes.string,
    showPaginationBelow: PropTypes.bool,
    hidePaginationOnLast: PropTypes.bool,
    renderPagination: PropTypes.func,
    onFinish: PropTypes.func,
    uuid: PropTypes.string,
    swipeDirection: PropTypes.string,
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
    stackOffsetY: 5,
    stackDepth: 5,
    onClick: () => {},
    onRightSwipe: () => {},
    onLeftSwipe: () => {},
    onRemoveCard: () => {},
    renderCard: null,
    style: styles.container,
    dragY: true,
    smoothTransition: false,
    tapToNext: false,
    dragDownToBack: false,
    backPressToBack: true,
    swipeThroughStack: false,
    onFirstBackPressed: () => {},
    renderHeader: () => {},
    showPagination: true,
    paginationDotColor: '#C5C5C5',
    paginationActiveDotColor: '#4D4D4E',
    showPaginationBelow: false,
    hidePaginationOnLast: false,
    renderPagination: null,
    onFinish: () => {},
    uuid: 'Y8sivEVkWc0p',
    swipeDirection: 'right',
  };

  constructor(props) {
    super(props);
    const { children, swiperThreshold, index } = this.props;
    SWIPE_THRESHOLD = swiperThreshold || SWIPE_THRESHOLD;

    this.currentIndex = {};
    this.guid = props.uuid;

    if (!this.currentIndex[this.guid]) this.currentIndex[this.guid] = index;

    this.pan = new Animated.ValueXY();
    this.valueX = 0;
    this.valueY = 0;

    this.enter = new Animated.Value(0.9);
    this.textAnim = new Animated.Value(0.8);

    this.state = {
      card: children[this.currentIndex[this.guid]],
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
      BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
    }
    this.pan.x.addListener(({ value }) => { this.valueX = value; });
    this.pan.y.addListener(({ value }) => { this.valueY = value; });
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
    if (Platform.OS === 'android' && this.props.backPressToBack) {
      BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
    }
    this.pan.x.removeAllListeners();
    this.pan.y.removeAllListeners();
  }

  getCurrentCard = () => this.props.children[this.currentIndex[this.guid]];

  handleStartShouldSetPanResponder = (e, gestureState) => {
    this.lastX = gestureState.moveX;
    this.lastY = gestureState.moveY;
    return false;
  }

  handleMoveShouldSetPanResponder = (e, gestureState) =>
  Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;

  handlePanResponderGrant = () => {
    this.pan.setOffset({ x: this.valueX, y: this.valueY });
    this.pan.setValue({ x: 0, y: 0 });
  };e

  handlePanResponderMove = () => Animated.event([
    null, { dx: this.pan.x, dy: this.props.dragY ? this.pan.y : new Animated.Value(0) },
  ]);

  handlePanResponderEnd = (e, { vx, vy, dx, dy }) => {
    const { card } = this.state;
    this.pan.flattenOffset();

    const {
      onRightSwipe,
      onLeftSwipe,
      onRemoveCard,
      onClick,
      tapToNext,
      stack,
      dragDownToBack,
      swipeDirection,
    } = this.props;

    let velocity;
    if (vx >= 0) {
      velocity = clamp(vx, 4, 6);
    } else if (vx < 0) {
      velocity = clamp(vx * -1, 4, 6) * -1;
    } else {
      velocity = dx < 0 ? -3 : 3;
    }

    let velocityY;
    if (vy >= 0) {
      velocityY = clamp(vy, 4.5, 10);
    } else if (vy < 0) {
      velocityY = clamp(vy * -1, 4.5, 10) * -1;
    } else {
      velocityY = dy < 0 ? -6 : 6;
    }

    if ((dx === 0) && (dy === 0)) {
      onClick(card);
      if (tapToNext) this.advanceState(velocity, vy, true);
    }

    const accumulatedX = Math.abs(dx);

    if (dragDownToBack && accumulatedX < 20 && dy > SWIPE_THRESHOLD - 30) {
      this.advanceState(velocity, vy, false);
      return;
    }

    const panX = Math.abs(this.valueX);
    const panY = Math.abs(this.valueY);

    if ((!isNaN(panY) && panX > SWIPE_THRESHOLD) || (!isNaN(panY) && panY > SWIPE_THRESHOLD)) {
      if (stack) {
        // if stack, any direction removes card
        if (this.valueX > 0 && swipeDirection === 'right') {
          onRightSwipe(card);
        } else {
          onLeftSwipe(card);
        }
        this.advanceState(velocity, vy, true, accumulatedX, velocityY);
        return;
      }

      if (this.valueX > 0 && swipeDirection === 'right') {
        onRightSwipe(card);
        this.advanceState(velocity, vy, true);
      } else {
        onLeftSwipe(card);
        this.advanceState(velocity, vy, false);
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
            card: this.props.children[this.currentIndex[this.guid]],
          });
        }
      } else {
        const total = this.props.children.length;

        if (this.currentIndex[this.guid] < total - 1) {
          this.currentIndex[this.guid] += 1;

          this.setState({
            card: this.props.children[this.currentIndex[this.guid]],
          });
        } else if (this.props.loop) {
          this.currentIndex[this.guid] = 0;

          this.setState({
            card: this.props.children[0],
          });
        } else {
          this.props.onFinish();
        }
      }
    } else if (isNext) this.goToNextCard();
    else this.goToPrevCard();
  }

  advanceState = (velocityX, vy, isNext, accumulatedX, velocityY) => {
    const { smoothTransition, stack } = this.props;

    if (smoothTransition) {
      this.handleDirection(isNext);
    } else {
      const velocity = accumulatedX < SWIPE_THRESHOLD ?
        { x: 0, y: velocityY } : { x: velocityX, y: vy };

      this.cardAnimation = Animated.decay(this.pan, {
        velocity,
        deceleration: stack ? 0.99 : 0.986,
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
    const total = this.props.children.length;
    if (this.currentIndex[this.guid] < total - 1) {
      this.currentIndex[this.guid] += 1;
      this.setState({
        card: this.props.children[this.currentIndex[this.guid]],
      });
    } else if (this.currentIndex[this.guid] === total - 1) {
      if (this.props.loop) {
        this.currentIndex[this.guid] = 0;

        this.setState({
          card: this.props.children[this.currentIndex[this.guid]],
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
      card: this.props.children[this.currentIndex[this.guid]],
    });
  }

  animateEntrance = () => {
    Animated.timing(
      this.textAnim,
      { toValue: 1 },
    ).start();

    Animated.spring(
      this.enter,
      { toValue: 1, tension: 20 },
    ).start();
  }

  resetPan = () => {
    Animated.spring(this.pan, {
      toValue: { x: 0, y: 0 },
      friction: 4,
    }).start();
  }

  resetState = () => {
    const { stack, smoothTransition } = this.props;

    this.pan.setValue({ x: 0, y: 0 });
    this.enter.setValue(stack || smoothTransition ? 0.985 : 0.97);
    this.textAnim.setValue(0.8);
    this.animateEntrance();
  }

  forceLeftSwipe = () => {
    this.cardAnimation = Animated.timing(this.pan, {
      toValue: { x: -500, y: 0 },
    }).start((status) => {
      this.resetState();
      if (status.finished) this.handleDirection(false);

      this.cardAnimation = null;
    });
    this.props.onRemoveCard(this.currentIndex[this.guid]);
  }

  forceRightSwipe = () => {
    this.cardAnimation = Animated.timing(this.pan, {
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
      this.props.onFirstBackPressed();
    } else {
      this.forceLeftSwipe();
    }

    return true;
  }

  calcOffsetY = (index, y) => y * index;

  calcScale = reversedIndex => 1 - ((reversedIndex) * 0.005);

  jumpToIndex = (index) => {
    this.currentIndex[this.guid] = index;

    this.setState({
      card: this.props.children[this.currentIndex[this.guid]],
    });
  }

  renderPagination = () => {
    const total = this.props.children.length;
    const index = this.currentIndex[this.guid];
    const { paginationDotColor, paginationActiveDotColor,
      showPaginationBelow, renderPagination, stack, hidePaginationOnLast } = this.props;

    if (renderPagination) {
      return (
        <View
          style={[showPaginationBelow && styles.bottomPagination,
            !stack && { zIndex: 1000 },
            (hidePaginationOnLast && total - 1 === index) && { opacity: 0 },
          ]}
        >
          {renderPagination(total, index)}
        </View>);
    }

    const dots = [];
    for (let i = 0; i < total; i += 1) {
      const Touchable = Platform.OS === "android" ? TouchableNativeFeedback: TouchableOpacity
      dots.push(
        <Touchable
          hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}
          key={i}
          onPress={() => this.jumpToIndex(i)}
        >
          <View
            style={[styles.dot, { backgroundColor: paginationDotColor || '#C5C5C5' },
              index >= i ? { backgroundColor: paginationActiveDotColor || '#4D4D4E' } : null]}
          />
        </Touchable>,
      );
    }

    return (
      <View
        style={[styles.dotContainer,
          showPaginationBelow && styles.bottomPagination,
          !stack && { zIndex: 1000 },
          (hidePaginationOnLast && total - 1 === index) && { opacity: 0 },
        ]}
      >
        {dots}
      </View>);
  }

  /**
   * Renders the cards as a stack with props.stackDepth cards deep.
   */
  renderStack = () => {
    const { swiper, stackOffsetY: offsetY, stackDepth, swipeThroughStack, scaleOthers, children } = this.props;

    const reversedCards = children
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
      let opacity = 1;
      const scaleY = 1;

      if (i === 0 && count > stackDepth) {
        /* ===============================================================================
         last card!
         hide it behind the others at first, show it after transforms
         dont hide if there are not enough cards anymore
         =============================================================================== */
        // to hide the card, set the offsetY the samle value as the card above / before
        const lastOffsetY = this.calcOffsetY(count - 2, offsetY);
        translateY = Animated.add(this.pan.y, this.pan.x).interpolate({
          inputRange: [-120, 0, 120],
          outputRange: [cardOffsetYEnd, lastOffsetY, cardOffsetYEnd],
          extrapolate: 'clamp',
        });
        scaleX = Animated.add(this.pan.y, this.pan.x).interpolate({
          inputRange: [-120, 0, 120],
          outputRange: [cardScaleEnd, cardScaleX, cardScaleEnd],
          extrapolate: 'clamp',
        });
        opacity = this.enter.interpolate({ inputRange: [0.6, 1], outputRange: [0.8, 1] });
      } else if (i === count - 1) {
        /* ===============================================================================
         first card!
         add panHandlers and other transforms
         =============================================================================== */
        rotate = this.pan.x.interpolate({ inputRange: [-400, 0, 400], outputRange: ['-8deg', '0deg', '8deg'] });
        translateY = this.pan.y;
        translateX = this.pan.x;
        panHandlers = swiper && (children.length - 1 !== this.currentIndex[this.guid] || swipeThroughStack) ?
          this.panResponder.panHandlers : {};
        if (this.pan.y === 0 && this.pan.x === 0) {
          translateY = this.enter.interpolate({ inputRange: [0.5, 1], outputRange: [5, 50] });
        }
      } else {
        /* ===============================================================================
         cards between first and last!
         =============================================================================== */
        translateY = Animated.add(this.pan.y, this.pan.x).interpolate({
          inputRange: [-120, 0, 120],
          outputRange: [cardOffsetYEnd, cardOffsetY, cardOffsetYEnd],
          extrapolate: 'clamp',
        });
        scaleX = Animated.add(this.pan.y, this.pan.x).interpolate({
          inputRange: [-120, 0, 120],
          outputRange: [cardScaleEnd, cardScaleX, cardScaleEnd],
          extrapolate: 'clamp',
        });
        opacity = this.enter.interpolate({ inputRange: [0.6, 1], outputRange: [0.9, 1] });
        if (this.pan.y === 0) {
          translateY = this.enter.interpolate({ inputRange: [0.5, 1], outputRange: [0, 30] });
        }
      }

      const animatedCardStyles = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        borderRadius: 10,
        height: deviceHeight - 130 - offsetY,
        opacity,
        transform: [
          { translateY },
          { rotate },
          { translateX },
          { scaleX: scaleOthers ? scaleX : 1 },
          { scaleY },
        ],
      };

      return (
        <Animated.View
          key={has.call(card, 'key') && card.key ? card.key : i}
          style={animatedCardStyles}
          {...panHandlers}
        >
          {card}
        </Animated.View>);
    });

    return (
      <View>
        {cardStack}
      </View>
    );
  }

  renderCard = () => {
    const { swiper, renderCard, smoothTransition } = this.props;
    const [translateX, translateY] = [this.pan.x, this.pan.y];

    const rotate = this.pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ['-30deg', '0deg', '30deg'] });
    const opacity = smoothTransition ?
      1 : this.pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: [0.5, 1, 0.5] });

    const scale = this.enter;

    const animatedCardStyles = {
      transform: [{ translateX }, { translateY }, { rotate }, { scale }],
      opacity,
    };

    const handler = swiper ? this.panResponder.panHandlers : {};

    return (
      <Animated.View
        style={[styles.card, animatedCardStyles]}
        {...handler}
      >
        {renderCard ? renderCard(this.state.card) : this.state.card}
      </Animated.View>
    );
  }

  render() {
    const { stack, renderHeader, style: propStyle, showPagination } = this.props;

    return (
      <View style={[styles.container, propStyle]}>
        {renderHeader(this.currentIndex[this.guid])}
        {showPagination && this.renderPagination()}
        {stack ? this.renderStack() : this.renderCard()}
      </View>
    );
  }
}
