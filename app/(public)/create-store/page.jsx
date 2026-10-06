"use client";
import { assets } from "@/assets/assets";
import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import Loading from "@/components/Loading";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";

export default function CreateStore() {
  const { user } = useUser();
  const router = useRouter();
  const { getToken } = useAuth();
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [storeInfo, setStoreInfo] = useState({
    name: "",
    username: "",
    description: "",
    email: "",
    contact: "",
    address: "",
    image: null,
  });

  // Pre-fill email if user is loaded and field is empty
  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      setStoreInfo((prev) => ({
        ...prev,
        email: prev.email || user.primaryEmailAddress.emailAddress,
      }));
    }
  }, [user]);

  const onChangeHandler = (e) => {
    setStoreInfo({ ...storeInfo, [e.target.name]: e.target.value });
  };

  const fetchSellerStatus = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/store/create", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (["pending", "approved", "rejected"].includes(data.status)) {
        setAlreadySubmitted(true);
        setStatus(data.status);
        switch (data.status) {
          case "pending":
            setMessage(
              "Your store application is under review. We will notify you once it's approved."
            );
            break;
          case "approved":
            setMessage(
              "Congratulations! Your store has been approved. Redirecting to your dashboard..."
            );
            break;
          case "rejected":
            setMessage(
              "Unfortunately, your store application was rejected. Please review the requirements and consider reapplying."
            );
            break;
          default:
            setMessage("");
        }
      } else {
        setAlreadySubmitted(false);
        setStatus("");
        setMessage("");
      }
    } catch (error) {
      console.error("Fetch seller status error:", error);
      toast.error(error?.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Redirect to store dashboard if approved
  useEffect(() => {
    if (status === "approved") {
      const timer = setTimeout(() => {
        router.push("/store");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!user) {
      return toast.error("Please login to continue");
    }

    if (!storeInfo.image) {
      return toast.error("Please upload a store logo");
    }

    if (
      !storeInfo.name.trim() ||
      !storeInfo.username.trim() ||
      !storeInfo.description.trim() ||
      !storeInfo.email.trim() ||
      !storeInfo.contact.trim() ||
      !storeInfo.address.trim()
    ) {
      return toast.error("Please fill in all store fields");
    }

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("name", storeInfo.name.trim());
      formData.append("username", storeInfo.username.trim().toLowerCase());
      formData.append("description", storeInfo.description.trim());
      formData.append("email", storeInfo.email.trim());
      formData.append("contact", storeInfo.contact.trim());
      formData.append("address", storeInfo.address.trim());
      formData.append("image", storeInfo.image);

      const { data } = await axios.post("/api/store/create", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(data.message || "Store application submitted successfully!");
      await fetchSellerStatus();
    } catch (error) {
      console.error("Store submit error:", error);
      toast.error(error?.response?.data?.error || error.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSellerStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-[80vh] max-6 flex items-center justify-center text-slate-400">
        <h1 className="text-2xl sm:text-4xl font-semibold">
          Please <span className="text-slate-500">Login</span> to continue
        </h1>
      </div>
    );
  }

  return !loading ? (
    <>
      {!alreadySubmitted ? (
        <div className="mx-6 min-h-[70vh] my-16">
          <form
            onSubmit={(e) =>
              toast.promise(onSubmitHandler(e), {
                loading: "Submitting store details...",
              })
            }
            className="max-w-7xl mx-auto flex flex-col items-start gap-3 text-slate-500"
          >
            {/* Title */}
            <div>
              <h1 className="text-3xl ">
                Add Your{" "}
                <span className="text-slate-800 font-medium">Store</span>
              </h1>
              <p className="max-w-lg">
                To become a seller on GoCart, submit your store details for
                review. Your store will be activated after admin verification.
              </p>
            </div>

            <label className="mt-10 cursor-pointer">
              Store Logo
              <Image
                src={
                  storeInfo.image
                    ? URL.createObjectURL(storeInfo.image)
                    : assets.upload_area
                }
                className="rounded-lg mt-2 h-16 w-auto object-cover"
                alt="Store Logo"
                width={150}
                height={100}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setStoreInfo({ ...storeInfo, image: e.target.files[0] })
                }
                hidden
              />
            </label>

            <p>Username</p>
            <input
              name="username"
              onChange={onChangeHandler}
              value={storeInfo.username}
              type="text"
              placeholder="Enter your store username"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
              required
            />

            <p>Name</p>
            <input
              name="name"
              onChange={onChangeHandler}
              value={storeInfo.name}
              type="text"
              placeholder="Enter your store name"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
              required
            />

            <p>Description</p>
            <textarea
              name="description"
              onChange={onChangeHandler}
              value={storeInfo.description}
              rows={5}
              placeholder="Enter your store description"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded resize-none"
              required
            />

            <p>Email</p>
            <input
              name="email"
              onChange={onChangeHandler}
              value={storeInfo.email}
              type="email"
              placeholder="Enter your store email"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
              required
            />

            <p>Contact Number</p>
            <input
              name="contact"
              onChange={onChangeHandler}
              value={storeInfo.contact}
              type="text"
              placeholder="Enter your store contact number"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded"
              required
            />

            <p>Address</p>
            <textarea
              name="address"
              onChange={onChangeHandler}
              value={storeInfo.address}
              rows={5}
              placeholder="Enter your store address"
              className="border border-slate-300 outline-slate-400 w-full max-w-lg p-2 rounded resize-none"
              required
            />

            <button
              type="submit"
              className="bg-slate-800 text-white px-12 py-2 rounded mt-10 mb-40 active:scale-95 hover:bg-slate-900 transition cursor-pointer"
            >
              Submit
            </button>
          </form>
        </div>
      ) : (
        <div className="min-h-[80vh] flex flex-col items-center justify-center">
          <p className="sm:text-2xl lg:text-3xl mx-5 font-semibold text-slate-500 text-center max-w-2xl">
            {message}
          </p>
          {status === "approved" && (
            <p className="mt-5 text-slate-400">
              redirecting to dashboard in{" "}
              <span className="font-semibold">5 seconds</span>
            </p>
          )}
          {status === "rejected" && (
            <button
              onClick={() => setAlreadySubmitted(false)}
              className="mt-6 bg-slate-800 text-white px-8 py-2 rounded hover:bg-slate-900 transition cursor-pointer"
            >
              Reapply / Update Store Details
            </button>
          )}
        </div>
      )}
    </>
  ) : (
    <Loading />
  );
}
