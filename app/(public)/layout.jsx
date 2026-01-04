"use client";
import Banner from "@/components/Banner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useRef } from "react"; // Add useRef
import { fetchProducts } from "@/lib/features/product/productSlice";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@clerk/clerk-react";
import { fetchCart, uploadCart } from "@/lib/features/cart/cartSlice";
import { fetchAddresses } from "@/lib/features/address/addressSlice";
import { fetchUserRatings } from "@/lib/features/rating/ratingSlice";

export default function PublicLayout({ children }) {
    const dispatch = useDispatch()
    const { user } = useUser()
    const { getToken } = useAuth()
    const { cartItems } = useSelector((state) => state.cart) // Fixed: cartItems not cardItems
    
    // Prevent multiple calls
    const hasFetchedCart = useRef(false)
    const hasFetchedAddresses = useRef(false)

    console.log('User:', user?.id) // Check if user exists
    console.log('Cart Items:', cartItems) // Check cart state

    useEffect(() => {
        dispatch(fetchProducts({}))
        dispatch(fetchUserRatings({getToken}))
    }, [dispatch, user]);

    useEffect(() => {
        console.log('Attempting to fetch cart for user:', user?.id)
        if(user && !hasFetchedCart.current){
            dispatch(fetchCart({getToken}))
            hasFetchedCart.current = true
        }
        
    }, [user, getToken, dispatch]);

    useEffect(() => {
        console.log('Attempting to fetch addresses for user:', user?.id)
        if(user && !hasFetchedAddresses.current){
            dispatch(fetchAddresses({getToken}))
            hasFetchedAddresses.current = true
        }
    }, [user, getToken, dispatch]);

    // Upload cart when cartItems change (with debounce)
    useEffect(() => {
        if(!user || !hasFetchedCart.current) return
        
        console.log('Cart items changed:', cartItems)
        console.log('Attempting to upload cart...')
        
        const timeoutId = setTimeout(() => {
            dispatch(uploadCart({getToken}))
        }, 1000) // Debounce for 1 second
        
        return () => clearTimeout(timeoutId)
    }, [cartItems, user, getToken, dispatch]);

    return (
        <>
            <Banner />
            <Navbar />
            {children}
            <Footer />
        </>
    );
}