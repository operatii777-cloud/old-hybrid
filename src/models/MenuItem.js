/**
 * MenuItem model representing a food or beverage item
 */
class MenuItem {
  constructor(name, description, price, category) {
    this.id = this._generateId();
    this.name = name;
    this.description = description;
    this.price = price;
    this.category = category; // appetizer, main, dessert, beverage, etc.
    this.available = true;
    this.createdAt = new Date();
  }

  _generateId() {
    return 'ITEM-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
  }

  setAvailability(available) {
    this.available = available;
  }

  updatePrice(newPrice) {
    this.price = newPrice;
  }

  getInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      category: this.category,
      available: this.available
    };
  }
}

module.exports = MenuItem;
