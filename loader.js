// loader.js
document.addEventListener("DOMContentLoaded", function () {
  const preloader = document.getElementById("preloader");
  if (!preloader) return;

  const hide = () => {
    try {
      // انسخ أسلوب الإخفاء نفسه دائمًا لضمان زواله
      preloader.style.transition = "opacity 0.4s ease";
      preloader.style.opacity = "0";
      preloader.classList.add("hidden");
      setTimeout(() => { preloader.style.display = "none"; }, 400);
    } catch (_) {}
  };

  // أخفِه مبكرًا قدر الإمكان لنُشبه index.html (بدون انتظار تحميل الصور)
  hide();

  // ضمان الإخفاء بعد اكتمال تحميل الصفحة التقليدي
  window.addEventListener("load", hide);

  // معالجة الرجوع/التقدم من الهيستوري (BFCache): تُعاد الصفحة ومعها اللودر ظاهر
  // pageshow يُطلق حتى لو لم تُنفّذ DOMContentLoaded ثانيةً
  window.addEventListener("pageshow", function (e) {
    // في كل الأحوال أخفِ اللودر، خصوصًا عندما e.persisted=true
    hide();
  });

  // في بعض البيئات قد يُطلق popstate بدون pageshow فورًا
  window.addEventListener("popstate", hide);

  // كضمان إضافي: بمجرد أن تصبح الصفحة مرئية نزيل اللودر
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") hide();
  });
});
