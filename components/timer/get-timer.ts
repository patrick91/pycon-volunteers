export const getTimer = ({ delta }: { delta: number }) => {
  const prefix = delta < 0 ? '-' : '';
  delta = Math.abs(delta);

  const hours = Math.floor(delta / (1000 * 60 * 60));
  const minutes = Math.floor((delta / (1000 * 60)) % 60);
  const seconds = Math.floor((delta / 1000) % 60);

  return (
    prefix +
    [hours]
      .filter((x) => x > 0)
      .concat(minutes)
      .concat(seconds)
      .map((x) => (x < 10 ? `0${x}` : `${x}`))
      .join(':')
  );
};
