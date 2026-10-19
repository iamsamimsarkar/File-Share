import React from 'react';
import { X, Check } from 'lucide-react';
import { PIZZA_RECIPES } from '../utils/pizzaNames';
import { PizzaGraphic } from './PizzaGraphic';
import { playSlicePop } from '../utils/audio';

interface RecipesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRecipeId: string;
  onSelectRecipe: (id: string) => void;
}

export const RecipesModal: React.FC<RecipesModalProps> = ({
  isOpen,
  onClose,
  selectedRecipeId,
  onSelectRecipe,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={() => {
            playSlicePop();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold tracking-tight text-stone-900 dark:text-white mb-2">
          Pizza Oven Recipes 🍕
        </h3>
        <p className="text-xs text-stone-600 dark:text-stone-400 mb-6">
          Pick your favorite artisan style. Each recipe updates your real-time baking graphics and slice toppings!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PIZZA_RECIPES.map((recipe) => {
            const isSelected = recipe.id === selectedRecipeId;
            return (
              <button
                key={recipe.id}
                type="button"
                onClick={() => {
                  onSelectRecipe(recipe.id);
                  playSlicePop();
                }}
                className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-500/20 shadow-sm'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-950'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                      {recipe.name}
                    </h4>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                      {recipe.description}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="p-1 rounded-full bg-amber-500 text-stone-950 shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-stone-500 uppercase tracking-wider font-mono">
                  <span>Toppings:</span>
                  <span className="text-amber-700 dark:text-amber-400 font-semibold lowercase">
                    {recipe.toppings.join(', ')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => {
              playSlicePop();
              onClose();
            }}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 transition-colors shadow-xs"
          >
            Apply Recipe
          </button>
        </div>
      </div>
    </div>
  );
};
