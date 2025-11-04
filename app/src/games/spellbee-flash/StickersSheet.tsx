import { useState } from "react";
import type { StickersState } from "./utils";
import {
  STICKER_SHOP,
  purchaseSticker,
  placeSticker,
  removeSticker,
  saveStickers,
  logEvent
} from "./utils";

interface StickersSheetProps {
  stickersState: StickersState;
  totalCoins: number;
  onClose: () => void;
  onCoinsUpdate: (newCoins: number) => void;
  onStickersUpdate: (newState: StickersState) => void;
}

export default function StickersSheet({
  stickersState,
  totalCoins,
  onClose,
  onCoinsUpdate,
  onStickersUpdate,
}: StickersSheetProps) {
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handlePurchase = (emoji: string) => {
    const result = purchaseSticker(emoji, totalCoins, stickersState);
    if (result.success) {
      logEvent("sticker_buy", { emoji, coins: result.newCoins });
      onCoinsUpdate(result.newCoins);
      onStickersUpdate(result.newState);
      saveStickers(result.newState);
      setErrorMessage("");
    } else {
      setErrorMessage(result.error || "Purchase failed");
      setTimeout(() => setErrorMessage(""), 2000);
    }
  };

  const handlePlace = (slotIndex: number) => {
    if (!selectedSticker) return;
    
    logEvent("sticker_place", { emoji: selectedSticker, slot: slotIndex });
    const newState = placeSticker(selectedSticker, slotIndex, stickersState);
    onStickersUpdate(newState);
    saveStickers(newState);
    setSelectedSticker(null);
  };

  const handleRemove = (slotIndex: number) => {
    const newState = removeSticker(slotIndex, stickersState);
    onStickersUpdate(newState);
    saveStickers(newState);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-4xl font-black text-purple-600">🎉 Sticker Sheet</h2>
            <p className="text-lg text-purple-700 mt-1">
              Collect and place stickers! (10 coins each)
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-purple-500 text-white font-bold rounded-full shadow-lg hover:bg-purple-600 transform hover:scale-105 transition-all duration-300"
          >
            Close
          </button>
        </div>

        {/* Coin Display */}
        <div className="bg-yellow-100 border-2 border-yellow-400 rounded-2xl p-4 mb-6 text-center">
          <div className="text-3xl font-bold text-yellow-900">
            🪙 {totalCoins} coins
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-100 border-2 border-red-400 rounded-2xl p-4 mb-6 text-center animate-pulse">
            <div className="text-xl font-bold text-red-600">{errorMessage}</div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Sticker Shop */}
          <div>
            <h3 className="text-2xl font-bold text-purple-600 mb-4">🛒 Shop</h3>
            <div className="grid grid-cols-3 gap-4">
              {STICKER_SHOP.map((emoji) => {
                const isOwned = stickersState.owned.includes(emoji);
                return (
                  <button
                    key={emoji}
                    onClick={() => !isOwned && handlePurchase(emoji)}
                    className={`
                      aspect-square text-6xl rounded-2xl shadow-lg transform transition-all duration-300
                      ${
                        isOwned
                          ? "bg-green-100 border-4 border-green-400 cursor-not-allowed opacity-70"
                          : "bg-white border-4 border-purple-300 hover:scale-110 hover:shadow-2xl cursor-pointer"
                      }
                    `}
                    disabled={isOwned}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <div>{emoji}</div>
                      {isOwned && (
                        <div className="text-sm font-bold text-green-600 mt-1">✓ Owned</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Placement Grid */}
          <div>
            <h3 className="text-2xl font-bold text-purple-600 mb-4">
              📋 Your Collection
            </h3>
            
            {/* Owned Stickers Selector */}
            <div className="mb-4 p-4 bg-purple-50 rounded-2xl">
              <p className="text-sm font-bold text-purple-600 mb-2">
                Select sticker to place:
              </p>
              <div className="flex flex-wrap gap-2">
                {stickersState.owned.length === 0 ? (
                  <p className="text-gray-500 italic">No stickers yet!</p>
                ) : (
                  stickersState.owned.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedSticker(emoji)}
                      className={`
                        text-4xl p-2 rounded-xl transform transition-all duration-200
                        ${
                          selectedSticker === emoji
                            ? "bg-purple-300 scale-110 ring-4 ring-purple-500"
                            : "bg-white hover:scale-105 hover:bg-purple-100"
                        }
                      `}
                    >
                      {emoji}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* 4x3 Grid */}
            <div className="grid grid-cols-4 gap-3">
              {stickersState.placed.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (emoji) {
                      handleRemove(index);
                    } else if (selectedSticker) {
                      handlePlace(index);
                    }
                  }}
                  className={`
                    aspect-square text-5xl rounded-xl shadow-lg transform transition-all duration-300
                    ${
                      emoji
                        ? "bg-gradient-to-br from-yellow-100 to-pink-100 border-4 border-pink-300 hover:scale-105"
                        : selectedSticker
                        ? "bg-white border-4 border-dashed border-purple-400 hover:bg-purple-50 hover:scale-105"
                        : "bg-gray-100 border-4 border-gray-300 cursor-not-allowed"
                    }
                  `}
                  disabled={!emoji && !selectedSticker}
                >
                  {emoji || (selectedSticker ? "➕" : "")}
                </button>
              ))}
            </div>

            <p className="text-sm text-gray-600 mt-3 text-center">
              {selectedSticker
                ? "Click a slot to place your sticker"
                : "Select a sticker above, then click a slot"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
