class RandomColor {
  constructor() {
    this.colors = ['#FFB301', '#F57C00', '#E91E63', '#8BC34A', '#00B8D9'];
    this.lastIndex = 0; // For getColorRepeatative()
    this.lastColor = '#FFB301'; // For getColorGauranteed()
  }

  getColorRepeatitive() {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * this.colors.length);
    } while (newIndex === this.lastIndex);
    this.lastIndex = newIndex;
    return this.colors[newIndex];
  }

  getColorGuaranteed() {
    const newColorsPool = this.colors.filter(color => color !== this.lastColor);
    this.lastColor = newColorsPool[Math.floor(Math.random() * newColorsPool.length)];
    return this.lastColor;
  }
}

module.exports = new RandomColor();