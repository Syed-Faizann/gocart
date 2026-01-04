// import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
// import axios from 'axios'



// export const fetchUserRatings = createAsyncThunk('rating/fetchUserRatings', async({getToken}, thunkAPI) => {
//    try {
//     const token = await getToken()
//     const {data} = await axios.get('api/rating', {headers: {Authorization: `Bearer ${token}`}})
//     return data ? data.rating : []
//    } catch (error) {
//     return thunkAPI.rejectWithValue(error.response.data)
//    }
// })


// const ratingSlice = createSlice({
//     name: 'rating',
//     initialState: {
//         ratings: [],
//     },
//     reducers: {
//         addRating: (state, action) => {
//             state.ratings.push(action.payload)
//         },
//     }, 
//     extraReducers: (builder) =>{
//         builder.addCase(fetchUserRatings.fulfilled, (state, action) => {
//             state.ratings = action.payload
//         })
//     }
// })

// export const { addRating } = ratingSlice.actions

// export default ratingSlice.reducer

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

export const fetchUserRatings = createAsyncThunk('rating/fetchUserRatings', async({getToken}, thunkAPI) => {
   try {
    const token = await getToken()
    const {data} = await axios.get('api/rating', {headers: {Authorization: `Bearer ${token}`}})
    // Fix: Use data.ratings (plural) not data.rating (singular)
    return data && data.ratings ? data.ratings : []
   } catch (error) {
    return thunkAPI.rejectWithValue(error.response.data)
   }
})

const ratingSlice = createSlice({
    name: 'rating',
    initialState: {
        ratings: [],
        loading: false,
        error: null,
    },
    reducers: {
        addRating: (state, action) => {
            state.ratings.push(action.payload)
        },
    }, 
    extraReducers: (builder) =>{
        builder
            .addCase(fetchUserRatings.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchUserRatings.fulfilled, (state, action) => {
                state.loading = false
                state.ratings = action.payload || [] // Ensure it's always an array
            })
            .addCase(fetchUserRatings.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload?.error || action.error.message
                state.ratings = [] // Reset to empty array on error
            })
    }
})

export const { addRating } = ratingSlice.actions

export default ratingSlice.reducer