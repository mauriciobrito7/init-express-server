import fs from 'fs';
import express from 'express';

class ProductManager {
  #path = '';

  constructor(path) {
    this.#path = path;
  }

  async #generateId(id = 0) {
    const products = await this.getProducts();
    if (products) {
      id =
        products.length === 0 ? 1 : products[products.length - 1].id + 1 + id;
      if (products.some((product) => product.id === id))
        this.#generateId(id) + 1;
      return id;
    }
  }

  async getProducts() {
    try {
      if (fs.existsSync(this.#path)) {
        const products = await fs.promises.readFile(this.#path, 'utf-8');
        const parsedProducts = JSON.parse(products);
        return parsedProducts;
      } else {
        return [];
      }
    } catch (error) {
      console.log(error);
    }
  }

  async addProduct(title, description, price, thumbnail, code, stock) {
    const products = await this.getProducts();
    const isCodeExists = products.some((product) => product.code === code);
    if (!isCodeExists && this.#path.length > 0) {
      try {
        const product = {
          title,
          description,
          price,
          thumbnail,
          code,
          stock,
          id: await this.#generateId(),
        };
        products.push(product);
        await fs.promises.writeFile(this.#path, JSON.stringify(products));
      } catch (error) {
        console.log(error);
      }
    } else {
      return console.log('product already exists');
    }
  }

  async getProductById(id) {
    const products = await this.getProducts();
    const product = products.find((product) => product.id === id);
    return product ? product : 'Not found';
  }

  async updateProduct(
    id,
    { title, description, price, thumbnail, code, stock }
  ) {
    const newProduct = {
      title,
      description,
      price,
      thumbnail,
      code,
      stock,
    };
    const products = await this.getProducts();
    const updatedProducts = products.map((product) => {
      if (product.id === id) {
        return {
          id,
          title: newProduct.title ? newProduct.title : product.title,
          description: newProduct.description
            ? newProduct.description
            : product.description,
          price: newProduct.price ? newProduct.price : product.price,
          thumbnail: newProduct.thumbnail
            ? newProduct.thumbnail
            : product.thumbnail,
          code: newProduct.code ? newProduct.code : product.code,
          stock: newProduct.stock ? newProduct.stock : product.stock,
        };
      }
      return product;
    });
    try {
      await fs.promises.writeFile(this.#path, JSON.stringify(updatedProducts));
    } catch (error) {
      console.log(error);
    }
  }

  async deleteProduct(id) {
    const products = await this.getProducts();
    if (products.length > 0) {
      const filterdProducts = products.filter((product) => product.id !== id);
      try {
        await fs.promises.writeFile(
          this.#path,
          JSON.stringify(filterdProducts)
        );
      } catch (error) {
        console.log(error);
      }
    }
  }
}

const PATH = './products.json';
const PORT = 8080;
const productManager = new ProductManager(PATH);
const app = express();

app.get('/products', async (req, res) => {
  const { limit } = req.query
  console.log('limit', limit)
  let products = await productManager.getProducts();
  if (limit) {
    products = products.slice(0, limit)
  }
  res.json(products);
})

app.get('/products/:id', async (req, res) => {
  const { id } = req.params
  const product = await productManager.getProductById(parseInt(id))
  res.json(product)
})

app.get('/', (req, res) => {
  res.send(`Hello World! Visit '/products' to see the products`);
})


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
})

