import React, { Component, PropTypes } from 'react';

import {
  StyleSheet,
  View,
  Animated,
  PanResponder,
} from 'react-native';
import clamp from 'clamp';
import uuid from 'react-native-uuid';

const SWIPE_THRESHOLD = 120;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  card: {
    flex: 1,
  },
});

const currentIndex = {};
let guid = 0;

export default class SwipeCards extends Component {

  static propTypes = {
    guid: PropTypes.number,
    cards: PropTypes.array,
    children: PropTypes.array,
    loop: PropTypes.bool,
    allowGestureTermination: PropTypes.bool,
    stack: PropTypes.bool,
    stackDepth: PropTypes.number,
    stackOffsetX: PropTypes.number,
    stackOffsetY: PropTypes.number,
    renderNoMoreCards: PropTypes.func,
    onClick: PropTypes.func,
    onRightSwipe: PropTypes.func,
    onLeftSwipe: PropTypes.func,
    renderCard: PropTypes.func,
    onRemoveCard: PropTypes.func,
    dragY: PropTypes.bool,
  };

  static defaultProps = {
    guid: 0,
    cards: [],
    children: [],
    loop: false,
    allowGestureTermination: true,
    stack: false,
    stackDepth: 5,
    stackOffsetX: 25,
    stackOffsetY: 0,
    onClick: () => {
    },
    onRightSwipe: () => {
    },
    onLeftSwipe: () => {
    },
    onRemoveCard: () => {},
    renderCard: null,
    renderNoMoreCards: () => {},
    style: styles.container,
    dragY: true,
  };

  constructor(props) {
    super(props);

    const { guid: _guid, cards, children } = this.props;

    this.guid = _guid || (guid += 1);
    if (!currentIndex[this.guid]) currentIndex[this.guid] = 0;

    this.state = {
      pan: new Animated.ValueXY(),
      enter: new Animated.Value(0.5),
      cards: cards.length ? [...cards] : [...children],
      card: cards.length ? cards[currentIndex[this.guid]] : children[currentIndex[this.guid]],
    };

    this.lastX = 0;
    this.lastY = 0;

    this.cardAnimation = null;

    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponderCapture: (e, gestureState) => {
        this.lastX = gestureState.moveX;
        this.lastY = gestureState.moveY;
        return false;
      },
      onMoveShouldSetPanResponderCapture: (e, gestureState) =>
        (Math.abs(this.lastX - gestureState.moveX) > 5
        || Math.abs(this.lastY - gestureState.moveY) > 5),
      onPanResponderGrant: () => {
        const { pan } = this.state;
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderTerminationRequest: () => this.props.allowGestureTermination,
      onPanResponderMove: Animated.event([
        null, { dx: this.state.pan.x, dy: this.props.dragY ? this.state.pan.y : 0 },
      ]),
      onPanResponderRelease: (e, { vx, vy, dx, dy }) => {
        const { pan, card } = this.state;
        const { onRightSwipe, onLeftSwipe, onRemoveCard, onClick } = this.props;

        pan.flattenOffset();
        let velocity;
        if ((dx === 0) && (dy === 0)) {
          onClick(card);
        }
        if (vx > 0) {
          velocity = clamp(vx, 3, 5);
        } else if (vx < 0) {
          velocity = clamp(vx * -1, 3, 5) * -1;
        }

        if (Math.abs(pan.x._value) > SWIPE_THRESHOLD) {
          let swipped = false;

          if (pan.x._value > 0) {
            swipped = true;
            onRightSwipe(card);
          } else {
            onLeftSwipe(card);
          }

          // Yup or nope was cancelled, return the card to normal.
          if (swipped) {
            this._resetPan();
            return;
          }

          this.cardAnimation = Animated.decay(pan, {
            velocity: { x: velocity, y: vy },
            deceleration: 0.98,
          });
          this.cardAnimation.start((status) => {
            if (status.finished) this._advanceState();
            else this._resetState();

            this.cardAnimation = null;
          },
          );

          onRemoveCard(currentIndex[this.guid]);
        } else {
          this._resetPan();
        }
      },
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
        cards: [].concat(nextProps.cards),
        card: nextProps.cards[0],
      });
    }
  }


  /**
   * Returns current card object
   */
  getCurrentCard() {
    return this.state.cards[currentIndex[this.guid]];
  }

  _goToNextCard() {
    currentIndex[this.guid] += 1;

    // Checks to see if last card.
    // If props.loop=true, will start again from the first card.
    if (currentIndex[this.guid] > this.state.cards.length - 1 && this.props.loop) {
      currentIndex[this.guid] = 0;
    }

    this.setState({
      card: this.state.cards[currentIndex[this.guid]],
    });
  }


  _goToPrevCard() {
    this.state.pan.setValue({ x: 0, y: 0 });
    this.state.enter.setValue(0);
    this._animateEntrance();

    currentIndex[this.guid] -= 1;

    if (currentIndex[this.guid] < 0) {
      currentIndex[this.guid] = 0;
    }

    this.setState({
      card: this.state.cards[currentIndex[this.guid]],
    });
  }

  _animateEntrance() {
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
    this._animateEntrance();
  }

  _advanceState() {
    this.state.pan.setValue({ x: 0, y: 0 });
    this.state.enter.setValue(0);
    this._animateEntrance();
    this._goToNextCard();
  }

  _forceLeftSwipe() {
    this.cardAnimation = Animated.timing(this.state.pan, {
      toValue: { x: -500, y: 0 },
    }).start((status) => {
      if (status.finished) this._advanceState();
      else this._resetState();

      this.cardAnimation = null;
    },
    );
    this.props.onRemoveCard(currentIndex[this.guid]);
  }

  _forceRightSwipe() {
    this.cardAnimation = Animated.timing(this.state.pan, {
      toValue: { x: 500, y: 0 },
    }).start((status) => {
      if (status.finished) this._advanceState();
      else this._resetState();

      this.cardAnimation = null;
    },
    );
    this.props.onRemoveCard(currentIndex[this.guid]);
  }

  renderNoMoreCards() {
    if (this.props.renderNoMoreCards) {
      return this.props.renderNoMoreCards();
    }

    return <View />;
  }

  /**
   * Renders the cards as a stack with props.stackDepth cards deep.
   */
  renderStack() {
    const { stackDepth, stackOffsetX, stackOffsetY } = this.props;
    if (!this.state.card) {
      return this.renderNoMoreCards();
    }
    // Get the next stack of cards to render.
    const cards = this.state.cards.slice(currentIndex[this.guid],
      currentIndex[this.guid] + stackDepth).reverse();

    return cards.map((card, i) => {
      const offsetX = (stackOffsetX * cards.length) - (i * stackOffsetX);
      const lastOffsetX = offsetX + stackOffsetX;

      const offsetY = (stackOffsetY * cards.length) - (i * stackOffsetY);
      const lastOffsetY = offsetY + stackOffsetY;

      const opacity = 0.25 + ((0.75 / cards.length) * (i + 1));
      const lastOpacity = 0.25 + ((0.75 / cards.length) * i);

      const scale = 0.85 + ((0.15 / cards.length) * (i + 1));
      const lastScale = 0.85 + ((0.15 / cards.length) * i);

      const style = {
        flex: 1,
        position: 'absolute',
        top: this.state.enter.interpolate({
          inputRange: [0, 1],
          outputRange: [lastOffsetY, offsetY],
        }),
        left: this.state.enter.interpolate({
          inputRange: [0, 1],
          outputRange: [lastOffsetX, offsetX],
        }),
        opacity: this.state.enter.interpolate({
          inputRange: [0, 1],
          outputRange: [lastOpacity, opacity],
        }),
        transform: [{
          scale: this.state.enter.interpolate({
            inputRange: [0, 1],
            outputRange: [lastScale, scale],
          }),
        }],
        elevation: i * 10,
      };

      // Is this the top card?  If so animate it and hook up the pan handlers.
      if (i + 1 === cards.length) {
        const { pan } = this.state;
        const [translateX, translateY] = [pan.x, pan.y];

        const rotate = pan.x.interpolate({
          inputRange: [-200, 0, 200],
          outputRange: ['-30deg', '0deg', '30deg'],
        });
        // const opacity = pan.x.interpolate({
        //   inputRange: [-200, 0, 200],
        //   outputRange: [0.5, 1, 0.5] });

        const animatedCardStyles = {
          ...style,
          transform: [
            { translateX },
            { translateY },
            { rotate },
            {
              scale: this.state.enter.interpolate({
                inputRange: [0, 1],
                outputRange: [lastScale, scale],
              }),
            },
          ],
        };

        return (
          <Animated.View
            key={uuid()}
            style={[styles.card, animatedCardStyles]}
            {... this._panResponder.panHandlers}
          >
            {this.props.renderCard ? this.props.renderCard(this.state.card) : this.state.card}
          </Animated.View>
        );
      }

      return (
        <Animated.View key={uuid()} style={style}>
          {this.props.renderCard ? this.props.renderCard(this.state.card) : this.state.card}
        </Animated.View>
      );
    });
  }

  renderCard() {
    if (!this.state.card) {
      return this.renderNoMoreCards();
    }

    const { pan, enter } = this.state;
    const [translateX, translateY] = [pan.x, pan.y];

    const rotate = pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ['-30deg', '0deg', '30deg'] });
    const opacity = pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: [0.5, 1, 0.5] });

    const scale = enter;

    const animatedCardStyles = {
      transform: [
        { translateX },
        { translateY },
        { rotate },
        { scale },
      ],
      opacity,
    };

    return (
      <Animated.View
        key={uuid()}
        style={[styles.card, animatedCardStyles]}
        {... this._panResponder.panHandlers}
      >
        {this.props.renderCard ? this.props.renderCard(this.state.card) : this.state.card}
      </Animated.View>
    );
  }

  render() {
    return (
      <View style={styles.container}>
        {this.props.stack ? this.renderStack() : this.renderCard()}
      </View>
    );
  }
}
