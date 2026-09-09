(() => {
  let tries = 0;
  const apply = () => {
    const grade4 = window.EDU_MATH?.byGrade?.[4];
    if (!Array.isArray(grade4)) {
      if (tries++ < 100) setTimeout(apply, 25);
      return;
    }
    grade4.forEach((section, index) => {
      const clean = String(section.title || "")
        .replace(/^S\d+\s*·\s*/i, "")
        .replace(/^§\d+\s*·\s*/i, "");
      section.title = `§${index + 1} · ${clean}`;
    });
  };
  apply();
})();
