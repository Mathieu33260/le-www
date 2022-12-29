/* eslint-disable */

/** https://codepen.io/jacobgunnarsson/pen/pbPwga **/
'use strict';

function Confettiful() {
  this.el = $('.js-confetti');
  this.containerEl = null;
  this.confettiFrequency = 3;
  this.confettiColors = ['#fce18a', '#ff726d', '#b48def', '#f4306d'];
  this.confettiAnimations = ['slow', 'medium', 'fast'];
  this._setupElements();
  this._renderConfetti();
}

Confettiful.prototype._setupElements = function () {
  var containerEl = document.createElement('div');
  var elPosition = this.el.css('position');
  if (elPosition !== 'relative' || elPosition !== 'absolute') {
    this.el.css('position','relative');
  }
  containerEl.classList.add('confetti-container');
  this.el.append(containerEl);
  this.containerEl = containerEl;
};

Confettiful.prototype._renderConfetti = function () {
  var _this = this;
  this.confettiInterval = setInterval(function () {
    var confettiEl = document.createElement('div');
    var confettiSize = Math.floor(Math.random() * 3) + 7 + 'px';
    var confettiBackground = _this.confettiColors[Math.floor(Math.random() * _this.confettiColors.length)];
    var confettiLeft = Math.floor(Math.random() * _this.el.width()) + 'px';
    var confettiAnimation = _this.confettiAnimations[Math.floor(Math.random() * _this.confettiAnimations.length)];
    confettiEl.classList.add('confetti', 'confetti--animation-' + confettiAnimation);
    confettiEl.style.left = confettiLeft;
    confettiEl.style.width = confettiSize;
    confettiEl.style.height = confettiSize;
    confettiEl.style.backgroundColor = confettiBackground;
    confettiEl.removeTimeout = setTimeout(function () {
      confettiEl.parentNode.removeChild(confettiEl);
    }, 3000);
    _this.containerEl.appendChild(confettiEl);
  }, 25);
};