import { PlusIcon, SquarePenIcon, XIcon } from "lucide-react";
import React, { useState, useEffect } from "react";
import AddressModal from "./AddressModal";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Protect, useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { useDispatch } from "react-redux";

const OrderSummary = ({ totalPrice, items }) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const dispatch = useDispatch();

  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";
  const router = useRouter();

  const addressList = useSelector((state) => state.address.list);

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [coupon, setCoupon] = useState("");

  // Debug address list on component mount
  useEffect(() => {
    console.log("Address List in OrderSummary:", addressList);
    if (addressList.length > 0) {
      console.log("First address structure:", addressList[0]);
      console.log("First address keys:", Object.keys(addressList[0]));
    }
  }, [addressList]);

  const handleCouponCode = async (event) => {
    event.preventDefault();
    try {
      if (!user) {
        return toast('Please login to proceed');
      }
      const token = await getToken();
      const { data } = await axios.post(
        '/api/coupon',
        { code: couponCodeInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCoupon(data.coupon);
      toast.success('Coupon Applied');
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    }
  };

const handlePlaceOrder = async (e) => {
    e.preventDefault();
    try {
      console.log("=== PLACING ORDER ===");
      
      if (!user) {
        return toast('Please login to proceed');
      }

      // Debug selected address
      console.log("Selected Address Object:", selectedAddress);
      
      if (!selectedAddress) {
        return toast.error("Please select an address");
      }

      // Get address ID - try both _id and id fields
      const addressId = selectedAddress._id || selectedAddress.id;
      console.log("Address ID extracted:", addressId);
      
      if (!addressId) {
        console.error("No address ID found. Address object:", selectedAddress);
        return toast.error("Invalid address selected. Please try again.");
      }

      // Check if items are valid
      if (!items || items.length === 0) {
        return toast.error("Your cart is empty");
      }

      const token = await getToken();

      const orderData = {
        addressId: addressId,
        paymentMethod,
        items: items.map(item => ({
          id: item.id,
          quantity: item.quantity,
        })),
      };
      
      if (coupon) {
        orderData.couponCode = coupon.code;
      }

      // Debug log
      console.log("Final Order Data:", orderData);

      // Create order
      const response = await axios.post('/api/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Order API Response:", response.data);
      
      // Handle different payment methods
      if (paymentMethod === "STRIPE") {
        // For Stripe payments - redirect to Stripe checkout
        if (response.data.session && response.data.session.url) {
          toast.success("Redirecting to secure payment...");
          // Redirect to Stripe checkout
          window.location.href = response.data.session.url;
        } else {
          toast.error("Failed to create payment session");
        }
      } else {
        // For COD payments - show success and redirect to orders
        toast.success("Order Placed Successfully");

        // Clear cart from Redux
        dispatch({ type: 'CLEAR_CART' });
        
        // Clear cart from database
        try {
          await axios.post('/api/cart', 
            { cart: {} },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (error) {
          console.error("Failed to clear cart from DB:", error);
        }
        
        // Redirect to orders page
        router.push("/orders");
      }
      
    } catch (error) {
      console.error("Order Error Details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "Failed to place order";
      
      toast.error(errorMessage);
    }
  };

  const handleAddressSelect = (e) => {
    const index = parseInt(e.target.value);
    console.log("Selected address index:", index);
    
    if (!isNaN(index) && index >= 0 && index < addressList.length) {
      const selected = addressList[index];
      console.log("Selected address:", selected);
      console.log("Address ID (trying _id):", selected._id);
      console.log("Address ID (trying id):", selected.id);
      setSelectedAddress(selected);
    }
  };

  return (
    <div className="w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7">
      <h2 className="text-xl font-medium text-slate-600">Payment Summary</h2>
      
      <p className="text-slate-400 text-xs my-4">Payment Method</p>
      <div className="flex gap-2 items-center">
        <input
          type="radio"
          id="COD"
          onChange={() => setPaymentMethod("COD")}
          checked={paymentMethod === "COD"}
          className="accent-gray-500"
        />
        <label htmlFor="COD" className="cursor-pointer">
          COD
        </label>
      </div>
      <div className="flex gap-2 items-center mt-1">
        <input
          type="radio"
          id="STRIPE"
          name="payment"
          onChange={() => setPaymentMethod("STRIPE")}
          checked={paymentMethod === "STRIPE"}
          className="accent-gray-500"
        />
        <label htmlFor="STRIPE" className="cursor-pointer">
          Stripe Payment
        </label>
      </div>

      <div className="my-4 py-4 border-y border-slate-200 text-slate-400">
        <p>Address</p>
        {selectedAddress ? (
          <div className="flex gap-2 items-center">
            <p>
              {selectedAddress.name}, {selectedAddress.city},{" "}
              {selectedAddress.state}, {selectedAddress.zip}
            </p>
            <SquarePenIcon
              onClick={() => setSelectedAddress(null)}
              className="cursor-pointer"
              size={18}
            />
          </div>
        ) : (
          <div>
            {addressList.length > 0 ? (
              <>
                <select
                  className="border border-slate-400 p-2 w-full my-3 outline-none rounded"
                  onChange={handleAddressSelect}
                  defaultValue=""
                >
                  <option value="" disabled>Select Address</option>
                  {addressList.map((address, index) => (
                    <option key={index} value={index}>
                      {address.name}, {address.city}, {address.state},{" "}
                      {address.zip}
                    </option>
                  ))}
                </select>
                <button
                  className="flex items-center gap-1 text-slate-600 mt-1"
                  onClick={() => setShowAddressModal(true)}
                >
                  Add New Address <PlusIcon size={18} />
                </button>
              </>
            ) : (
              <div className="mt-3">
                <p className="text-sm text-slate-500 mb-2">No addresses saved</p>
                <button
                  className="flex items-center gap-1 text-slate-600"
                  onClick={() => setShowAddressModal(true)}
                >
                  Add Address <PlusIcon size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pb-4 border-b border-slate-200">
        <div className="flex justify-between">
          <div className="flex flex-col gap-1 text-slate-400">
            <p>Subtotal:</p>
            <p>Shipping:</p>
            {coupon && <p>Coupon:</p>}
          </div>
          <div className="flex flex-col gap-1 font-medium text-right">
            <p>
              {currency}
              {totalPrice.toLocaleString()}
            </p>
            <p>
              <Protect plan={"plus"} fallback={`${currency}5`}>
                Free
              </Protect>
            </p>
            {coupon && (
              <p>{`-${currency}${((coupon.discount / 100) * totalPrice).toFixed(2)}`}</p>
            )}
          </div>
        </div>
        
        {!coupon ? (
          <form
            onSubmit={(e) =>
              toast.promise(handleCouponCode(e), {
                loading: "Checking Coupon...",
              })
            }
            className="flex justify-center gap-3 mt-3"
          >
            <input
              onChange={(e) => setCouponCodeInput(e.target.value)}
              value={couponCodeInput}
              type="text"
              placeholder="Coupon Code"
              className="border border-slate-400 p-1.5 rounded w-full outline-none"
            />
            <button className="bg-slate-600 text-white px-3 rounded hover:bg-slate-800 active:scale-95 transition-all">
              Apply
            </button>
          </form>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 text-xs mt-2">
            <p>
              Code:{" "}
              <span className="font-semibold ml-1">
                {coupon.code.toUpperCase()}
              </span>
            </p>
            <p>{coupon.description}</p>
            <XIcon
              size={18}
              onClick={() => setCoupon("")}
              className="hover:text-red-700 transition cursor-pointer"
            />
          </div>
        )}
      </div>

      <div className="flex justify-between py-4">
        <p>Total:</p>
        <p className="font-medium text-right">
          <Protect 
            plan={'plus'} 
            fallback={`${currency}${coupon
              ? (totalPrice + 5 - (coupon.discount / 100) * totalPrice).toFixed(2)
              : (totalPrice + 5).toLocaleString()}`}
          >
            {currency}
            {coupon
              ? (totalPrice - (coupon.discount / 100) * totalPrice).toFixed(2)
              : totalPrice.toLocaleString()}
          </Protect>
        </p>
      </div>

      <button
        onClick={(e) =>
          toast.promise(handlePlaceOrder(e), { 
            loading: "Placing Order...",
            success: "Order placed successfully!",
            error: "Failed to place order"
          })
        }
        disabled={!selectedAddress}
        className={`w-full py-2.5 rounded transition-all ${
          selectedAddress 
            ? "bg-slate-700 text-white hover:bg-slate-900 active:scale-95" 
            : "bg-slate-300 text-slate-500 cursor-not-allowed"
        }`}
      >
        {selectedAddress ? "Place Order" : "Select Address First"}
      </button>

      {showAddressModal && (
        <AddressModal 
          setShowAddressModal={setShowAddressModal}
          onAddressAdded={() => {
            // Refresh addresses if needed
            setShowAddressModal(false);
          }}
        />
      )}
    </div>
  );
};

export default OrderSummary;