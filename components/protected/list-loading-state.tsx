"use client";

interface ListLoadingStateProps {
  numberOfCards?: number;
}

export default function ListLoadingState({
  numberOfCards = 6,
}: ListLoadingStateProps) {
  const cardsPerGroup = 3;
  const numberOfGroups = Math.ceil(numberOfCards / cardsPerGroup);

  return (
    <div className="flex flex-col items-start justify-center gap-2">
      {Array.from({ length: numberOfGroups }).map((_, groupIndex) => {
        const startIndex = groupIndex * cardsPerGroup;
        const endIndex = Math.min(startIndex + cardsPerGroup, numberOfCards);
        const cardsInThisGroup = endIndex - startIndex;

        return (
          <div
            key={groupIndex}
            className="flex flex-col items-start justify-center w-full gap-2 mb-4"
          >
            <div className="w-32 mx-3 h-[32px] rounded-xl bg-gray-200 animate-pulse-gray" />
            {Array.from({ length: cardsInThisGroup }).map((_, cardIndex) => (
              <div
                key={startIndex + cardIndex}
                className="w-full h-[72px] rounded-3xl bg-gray-200 animate-pulse-gray"
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
