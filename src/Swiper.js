import React, { Component, PropTypes } from 'react';

import {
  StyleSheet,
  View,
  Text,
  Animated,
  PanResponder,
  Dimensions,
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

const currentIndex = {};
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

export default class Swiper extends Component {

  static propTypes = {
    cards: PropTypes.array,
    children: PropTypes.array,
    index: PropTypes.number,
    style: PropTypes.any,
    loop: PropTypes.bool,
    swiper: PropTypes.bool,
    swiperThreshold: PropTypes.number,
    allowGestureTermination: PropTypes.bool,
    stack: PropTypes.bool,
    stackOffsetY: PropTypes.number,
    onClick: PropTypes.func,
    onRightSwipe: PropTypes.func,
    onLeftSwipe: PropTypes.func,
    renderCard: PropTypes.func,
    onRemoveCard: PropTypes.func,
    dragY: PropTypes.bool,
    smoothTransition: PropTypes.bool,
    tapToNext: PropTypes.bool,
    dragDownToBack: PropTypes.bool,
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
    cards: [],
    children: [],
    index: 0,
    loop: false,
    swiper: true,
    swiperThreshold: null,
    allowGestureTermination: false,
    stack: false,
    stackOffsetY: 5,
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

    const { cards, children, swiperThreshold, index } = this.props;

    SWIPE_THRESHOLD = swiperThreshold || SWIPE_THRESHOLD;

    this.guid = uuid();
    if (!currentIndex[this.guid]) currentIndex[this.guid] = index;

    this.state = {
      pan: new Animated.ValueXY(),
      pan2: new Animated.ValueXY(),
      enter: new Animated.Value(0.8),
      fadeAnim: new Animated.Value(0.8),
      cards: cards.length ? [...cards] : [...children],
      card: cards.length ?
        cards[currentIndex[this.guid]] : children[currentIndex[this.guid]],
      card2: cards.length ?
        cards[currentIndex[this.guid] + 1] : children[currentIndex[this.guid] + 1],
    };

    this.lastX = 0;
    this.lastY = 0;

    this.cardAnimation = null;

    this._handleStartShouldSetPanResponder = this._handleStartShouldSetPanResponder.bind(this);
    this._handleMoveShouldSetPanResponder = this._handleMoveShouldSetPanResponder.bind(this);
    this._handlePanResponderGrant = this._handlePanResponderGrant.bind(this);
    this._handlePanResponderMove = this._handlePanResponderMove.bind(this);
    this._handlePanResponderEnd = this._handlePanResponderEnd.bind(this);
  }

  componentWillMount() {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponderCapture: this._handleStartShouldSetPanResponder,
      onMoveShouldSetPanResponderCapture: this._handleMoveShouldSetPanResponder,
      onPanResponderGrant: this._handlePanResponderGrant,
      onPanResponderTerminationRequest: () => this.props.allowGestureTermination,
      onPanResponderMove: this._handlePanResponderMove(),
      onPanResponderRelease: this._handlePanResponderEnd,
    });
  }

  componentDidMount() {
    this._animateEntrance();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.cards !== this.props.cards) {
      if (this.cardAnimation) {
        this.cardAnimation.stop();
        this.cardAnimation = null;
      }

      currentIndex[this.guid] = 0;
      this.setState({
        cards: [...nextProps.cards],
        card: nextProps.cards[0],
        card2: nextProps.cards[1],
      });
    }
  }

  /**
   * Returns current card object
   */
  getCurrentCard() {
    return this.state.cards[currentIndex[this.guid]];
  }

  _handleStartShouldSetPanResponder = (e, gestureState) => {
    this.lastX = gestureState.moveX;
    this.lastY = gestureState.moveY;
    return false;
  }

  _handleMoveShouldSetPanResponder = (e, gestureState) =>
  Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;

  _handlePanResponderGrant = () => {
    const { pan } = this.state;
    pan.setOffset({ x: pan.x._value, y: pan.y._value });
    pan.setValue({ x: 0, y: 0 });
  };

  _handlePanResponderMove = () => Animated.event([
    null, { dx: this.state.pan.x, dy: this.props.dragY ? this.state.pan.y : new Animated.Value(0) },
  ]);

  _handlePanResponderEnd = (e, { vx, vy, dx, dy }) => {
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
      if (tapToNext) this._advanceState(velocity, vy, true);
    }

    if (dragDownToBack && Math.abs(dx) < 10 && dy > SWIPE_THRESHOLD - 40) {
      this._advanceState(velocity, vy);
      return;
    }

    const panX = Math.abs(pan.x._value);
    const panY = Math.abs(pan.y._value);

    if ((!isNaN(panY) && panX > SWIPE_THRESHOLD) || (!isNaN(panY) && panY > SWIPE_THRESHOLD)) {
      if (stack) {
        // if stack, any direction removes card
        this._advanceState(velocity, vy, true);
        return;
      }

      if (pan.x._value > 0) {
        onRightSwipe(card);
        this._advanceState(velocity, vy, true);
      } else {
        onLeftSwipe(card);
        this._advanceState(velocity, vy);
      }
      onRemoveCard(currentIndex[this.guid]);
    } else {
      this._resetPan();
    }
  };

  _handleDirection(isNext) {
    this._resetState();

    if (this.props.stack) {
      let newIdx;
      let newIdx2;
      if (this.props.dragDownToBack && !isNext) {
        if (currentIndex[this.guid] > 0) {
          currentIndex[this.guid] -= 1;
          newIdx = currentIndex[this.guid];
          newIdx2 = newIdx + 1;

          this.setState({
            card: this.state.cards[newIdx],
            card2: this.state.cards[newIdx2],
          });
        }
      } else {
        const total = this.state.cards.length;
        currentIndex[this.guid] += 1;
        newIdx = currentIndex[this.guid];
        newIdx2 = newIdx + 1;

        if (newIdx < total) {
          this.setState({
            card: this.state.cards[newIdx],
            card2: this.state.cards[newIdx2],
          });
        } else if (this.props.loop) {
          currentIndex[this.guid] = 0;
          this.setState({
            card: this.state.cards[0],
            card2: this.state.cards[1],
          });
        } else {
          this.props.onFinish();
        }
      }
    } else if (isNext) this._goToNextCard();
    else this._goToPrevCard();
  }

  _advanceState(velocity, vy, isNext) {
    const { pan } = this.state;
    const { smoothTransition } = this.props;

    if (smoothTransition) {
      this._handleDirection(isNext);
    } else {
      this.cardAnimation = Animated.decay(pan, {
        velocity: { x: velocity, y: vy },
        deceleration: 0.98,
      });

      this.cardAnimation.start((status) => {
        if (status.finished) {
          this._handleDirection(isNext);
        } else this._resetState();

        this.cardAnimation = null;
      });
    }
  }

  _goToNextCard() {
    const total = this.state.cards.length;
    if (currentIndex[this.guid] < total - 1) {
      currentIndex[this.guid] += 1;
      this.setState({
        card: this.state.cards[currentIndex[this.guid]],
      });
    } else if (currentIndex[this.guid] === total - 1) {
      if (this.props.loop) {
        currentIndex[this.guid] = 0;

        this.setState({
          card: this.state.cards[currentIndex[this.guid]],
        });
      } else {
        this.props.onFinish();
      }
    }
  }

  _goToPrevCard() {
    currentIndex[this.guid] -= 1;

    if (currentIndex[this.guid] < 0) {
      currentIndex[this.guid] = 0;
    }

    this.setState({
      card: this.state.cards[currentIndex[this.guid]],
    });
  }

  _animateEntrance() {
    Animated.timing(
      this.state.fadeAnim,
      { toValue: 1 },
    ).start();

    Animated.spring(
      this.state.enter,
      { toValue: 1, friction: 8 },
    ).start();
  }

  _resetPan() {
    Animated.spring(this.state.pan, {
      toValue: { x: 0, y: 0 },
      friction: 4,
    }).start();
  }

  _resetState() {
    this.state.pan.setValue({ x: 0, y: 0 });
    this.state.enter.setValue(0);
    this.state.fadeAnim.setValue(0.8);
    this._animateEntrance();
  }

  forceLeftSwipe() {
    this.cardAnimation = Animated.timing(this.state.pan, {
      toValue: { x: -500, y: 0 },
    })
    .start((status) => {
      this._resetState();
      if (status.finished) this._goToPrevCard();

      this.cardAnimation = null;
    });
    this.props.onRemoveCard(currentIndex[this.guid]);
  }

  forceRightSwipe() {
    this.cardAnimation = Animated.timing(this.state.pan, {
      toValue: { x: 500, y: 0 },
    }).start((status) => {
      this._resetState();
      if (status.finished) this._goToNextCard();

      this.cardAnimation = null;
    });
    this.props.onRemoveCard(currentIndex[this.guid]);
  }

  renderPagination() {
    const total = this.state.cards.length;
    const index = currentIndex[this.guid];
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
        <View
          key={uuid()}
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
  renderStack() {
    const { pan, enter } = this.state;
    const { swiper, stackOffsetY, smoothTransition } = this.props;

    const [translateX, translateY] = [pan.x, pan.y];

    const rotate = pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ['-30deg', '0deg', '30deg'] });
    const opacity = smoothTransition ?
      1 : pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: [0.9, 1, 0.9] });

    const scale = enter;

    const topCardStyle = {
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      height: deviceHeight - 80 - stackOffsetY,
    };

    const animatedCardStyles = {
      transform: [{ translateX }, { translateY }, { rotate }, { scale }],
      opacity,
    };
    const animatedCardStyles2 = { transform: [{ translateY: stackOffsetY }, { scaleX: 0.98 }] };

    const handler = swiper ? this._panResponder.panHandlers : {};

    return (
      <View style={{ position: 'relative', flexDirection: 'column' }}>
        {(this.state.card) === undefined ?
          (<View />)
          :
          (
            <View>
              <Animated.View
                style={[animatedCardStyles2,
                  topCardStyle,
                  { opacity: this.state.fadeAnim },
                ]}
                {...handler}
              >
                {this.props.renderCard ? this.props.renderCard(this.state.card2) : this.state.card2}
              </Animated.View>
              <Animated.View style={[animatedCardStyles, topCardStyle]} {...handler}>
                {this.props.renderCard ? this.props.renderCard(this.state.card) : this.state.card}
              </Animated.View>
            </View>
          )
        }
      </View>
    );
  }

  renderCard() {
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

    const handler = swiper ? this._panResponder.panHandlers : {};

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
