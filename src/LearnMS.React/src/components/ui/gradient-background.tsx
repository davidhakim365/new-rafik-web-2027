const GradientBackground = () => {
  return (
    <>
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 h-[25rem] w-[25rem] rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 blur-[8rem] opacity-60"></div>
        <div className="absolute top-1/3 -right-32 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-rose-400 to-orange-300 blur-[8rem] opacity-50"></div>
        <div className="absolute -bottom-20 left-1/4 h-[25rem] w-[25rem] rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 blur-[8rem] opacity-60"></div>
        <div className="absolute top-1/4 right-1/4 h-[20rem] w-[20rem] rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-500 blur-[6rem] opacity-40"></div>
        <div className="absolute bottom-1/3 -left-16 h-[22rem] w-[22rem] rounded-full bg-gradient-to-br from-amber-300 to-pink-400 blur-[7rem] opacity-45"></div>
      </div>
      <div
        className="absolute inset-0 w-full h-full scale-[1.2] transform opacity-10 [mask-image:radial-gradient(#fff,transparent,75%)]"
        style={{
          backgroundImage: "url(/noise.webp)",
          backgroundSize: "30%",
        }}
      ></div>
    </>
  );
};

export default GradientBackground;
