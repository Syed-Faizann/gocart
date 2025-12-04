import { createSlice } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";



let debounceTimer = null;

// export const uploadCart = createAsyncThunk(
//   "cart/uploadCart",
//   async ({ getToken }, thunkAPI) => {
//     try {
//       clearTimeout(debounceTimer);
//       debounceTimer = setTimeout(async () => {
//         const token = await getToken({});
//         await axios.post(
//           "/api/cart",
//           { cart: cartItems },
//           { headers: { Authorization: `Bearer ${token}` } }
//         );
//         return;
//       }, 1000);
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

export const uploadCart = createAsyncThunk(
  "cart/uploadCart",
  async ({ getToken }, thunkAPI) => {
    try {
      console.log('uploadCart thunk called');
      
      // Get current state to access cartItems
      const state = thunkAPI.getState();
      const cartItems = state.cart.cartItems;
      
      console.log('Cart items to upload:', cartItems);
      
      const token = await getToken({});
      console.log('Token obtained:', token ? 'Yes' : 'No');
      
      const response = await axios.post(
        "/api/cart",
        { cart: cartItems },
        { 
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          }
        }
      );
      
      console.log('Upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Upload cart error:', error.response?.data || error.message);
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchCart = createAsyncThunk(
  "cart/fetchCart",
  async ({ getToken }, thunkAPI) => {
    try {
      const token = await getToken({});
      const { data } = await axios.get("/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    total: 0,
    cartItems: {},
  },
  reducers: {
    addToCart: (state, action) => {
      const { productId } = action.payload;
      if (state.cartItems[productId]) {
        state.cartItems[productId]++;
      } else {
        state.cartItems[productId] = 1;
      }
      state.total += 1;
    },
    removeFromCart: (state, action) => {
      const { productId } = action.payload;
      if (state.cartItems[productId]) {
        state.cartItems[productId]--;
        if (state.cartItems[productId] === 0) {
          delete state.cartItems[productId];
        }
      }
      state.total -= 1;
    },
    deleteItemFromCart: (state, action) => {
      const { productId } = action.payload;
      state.total -= state.cartItems[productId]
        ? state.cartItems[productId]
        : 0;
      delete state.cartItems[productId];
    },
    clearCart: (state) => {
      state.cartItems = {};
      state.total = 0;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(fetchCart.fulfilled, (state, action) => {
      state.cartItems = action.payload.cart
      state.total = Object.values(action.payload.cart).reduce(
        (acc, item) => acc + item,
        0
      );
    });
  }
});

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart } =
  cartSlice.actions;

export default cartSlice.reducer;
