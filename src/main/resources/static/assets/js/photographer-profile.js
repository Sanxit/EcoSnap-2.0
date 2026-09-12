/* ============================================
   ECO SNAP — Photographer Profile Page JavaScript
   Depends on: js/main.js (shared base)
   ============================================ */

// ============================================
// PHOTOGRAPHER DATA (keyed by ?id= param)
// ============================================
const PHOTOGRAPHERS = {
  1: {
    name: "Sangeeta Shrestha",
    tagline: "Capturing beautiful moments of life with an artistic perspective",
    location: "Kathmandu",
    experience: "8+ Years Experience",
    shoots: "340+ Shoots",
    rating: "4.9",
    reviewCount: 127,
    price: "Rs. 50,000",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2bc2baAJ2uWyZegNUVVFOvXcG5pj44gXOBW9P99m4fLZv8MyeN3Jjj6AL8yOvgrOa3jvI1-13WFafcE8PzBIXDqfuh22kv2_zDW6o77ylzEkodAqBlArLmGFpufEIUu1o6-iks6J6nmiyEntkeYGYDbp8KgY7nE1Chng-WnyQ0niMyq1mjQR-iP2F5gm0w9x4P6jdjmcwInVyiI-mhsYab7ujzC5CDyabi_lwJ6HRuVPZ8NJ8dNWk5w",
    cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWb1HFQ4gye_KvOSEQv17jMl-pl1VRCe8ZF0WG-wI-Gw9uDQ7Gv3LzW8mmy3_ygaRzIJiT-I9e72DoRHPFrd85d0rDQNxNr0A6KsdhfmucvFrDW1bEwkpBUUEmJTxzlohZGgqILKpsBCmZ0jyVLKDyGyi9beJsjkeHJX8ztkhxrLzYEAbxuuU4SkC9MQjtPC8ng2mvzaJ9yAr3npDVf_slwndjQtyS9OJhOo1_R8wyvLjGd3nJUOTULQ",
    tags: ["Wedding", "Portrait", "Corporate"],
    bio: "Hello! I'm Sangeeta Shrestha, a Kathmandu-based photographer. For the past 8 years, I have been capturing beautiful moments through my lens. My journey started with a love for vintage film cameras and natural light, which has now turned into my full-time profession."
  },
  2: {
    name: "Roshan Maharjan",
    tagline: "Professional perspective and editorial storyteller",
    location: "Lalitpur",
    experience: "10+ Years Experience",
    shoots: "520+ Shoots",
    rating: "4.8",
    reviewCount: 98,
    price: "Rs. 35,000",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDrZRQsS02C_hw5LNetKNJvFtsLk4j4Y7YKFdaDDS7Ou9lVrDx0kzUPXOoTYoXx1PVauObxK5SHwTbSD9XbfoNg6zBghRzBMRQEWILqDIUsqXW7LM5IJCbaX-xBC1jDXVDonWtR9lKg5XwvDfYy1rQYq9IYYLEb2vW7W-dJS8PF4IUgvj4ybyQAWMH8JTWkrPS1bv1YjTp8DKt21uNXfy1i9MfeoU13Si_AbOuWwk--uAe0LoHR8aEM2g",
    cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLtjwkITVVShLLquHGczx27Fb6lnVelsacdG5i1xmjjF_ijfeSoaKmNY7anI9TyzkQQJIxqEYtnHlhKJjXwiMM0w1EOm7VjbQAZ2qioVnuzHpnkMlg69xUen5GHqhcydRvvdIawuW7LLfk97objy2Gtb82Fg1F92J9vtnPOEcY75un5EI5bVXNd_sFoCtWPtFUld9p0vLNLgELOTLfx4JpUYtaES8AquGhrdaedYTqe22AX56FZ5ROvg",
    tags: ["Corporate", "Product"],
    bio: "I'm Roshan Maharjan, a commercial and advertising photographer in Lalitpur. For the past 10 years, I've been taking creative photos for various companies, brands, and products."
  },
  3: {
    name: "Anjali Gurung",
    tagline: "Celebrating family intimacy, new life, and spiritual connection",
    location: "Pokhara",
    experience: "6+ Years Experience",
    shoots: "280+ Shoots",
    rating: "5.0",
    reviewCount: 84,
    price: "Rs. 20,000",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBFi6FhEr8_k-PTk943x16LIMKpbOCEWsycj-sLdfjSJiqanWyJ1vKGwmgTU2bfkCauIHe2HL3tL0oO0BWOuQebeG7g1Mz-vZfbj0Z6YFOv3YTBlKRPXu9YmYpzWh2VJE4rj7rkfs_JiVq5suuii32aXhWmFWIEWCfjF0Ch-iMqq3xudQv7H--ATQwcTYnhR71jcsFY5ngHYchwaXyw96LADrk6JfI4HCfTy1C3NUq4hNiYU6LdshjJ_w",
    cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuAXRmI5UgMzQ2qmvBW2WtXqpH_GPGuoCUHAHYT-pGxRdQWKnqgbUg8nnII2ZakVSwR3Zk_0M2VodgiwZlYuQPgF8KAfMhI1uC92HCNRsDLvW1GRYvgFNt_nvKGlEwtqtz6UOgDJi8uD26indgvzk4EdpPzoCu3ZDbaR340VEhf8oBlMhdztqocWc3eutVm1WZonzk4vUKWLOoOdChAgqOXtwMietssCykkPx1AUllfMlCg7ID68P1jIBg",
    tags: ["Family", "Birthday", "Maternity"],
    bio: "Hello, I'm Anjali Gurung. Based in Pokhara, I capture the lovely moments of family gatherings, children, and beautiful feelings of maternity through my lens."
  },
  4: {
    name: "Manish Khadka",
    tagline: "Architecture and corporate photography with precision",
    location: "Bhaktapur",
    experience: "12+ Years Experience",
    shoots: "600+ Shoots",
    rating: "4.9",
    reviewCount: 142,
    price: "Rs. 30,000",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC8ZFTSx01EgmhMwYkQmKpbbkBDZUuYevRYDcust10w2brGV-CVT5kLjTVqPkNVUOozhsKFqtNgEBlQoSsEzftMeDjqoZIHSIrw5GH8RKMMtXigOvlzPW2tnNifP2HzMn-0Id_FgX6GaVIn3ARnQdDSHliVVaESs20BiuTpxLZHyrQbjylNnE-tdk5feXrjhozpDYKwrZcHhhXBpUj6efbAzycoKnrYK4IjG0YH4RcKiMXX0-pj-lmvrw",
    cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUgRQFXyY3teHI5iFwR1eMfMl1fveUDVWNslurAwd2FnncwOBcJPemPr7C5BhSMm3n2BUu7Vp-9VxV92kdgU0gFlWibj5Qrddjth-PAXek2bPOCoJ-mKKXa-hwqs2t4Wh_WVKWOkB-CDS3s1ydn59yBVCGgpOzwax6EailPkWctfdNrjPi33BC3KzPcMv3evFeGirAqAArnkJtLoV84H2xl6Nz7Qqa5_t__IY-FaYqlT9H8tvUx06tDA",
    tags: ["Architecture", "Corporate"],
    bio: "I'm Manish Khadka, a Bhaktapur-based architecture and industrial photographer. For the last 12 years, I have been photographing buildings, interior designs, and corporate environments."
  },
  5: {
    name: "Alisha Shrestha",
    tagline: "Cinematic style romantic wedding stories",
    location: "Chitwan",
    experience: "9+ Years Experience",
    shoots: "410+ Shoots",
    rating: "5.0",
    reviewCount: 156,
    price: "Rs. 60,000",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDcc6TJzWLDOLtLf9Zo2uDTtUuWt8NszUc8AWUvKyDGpDWLaKQuqBwXTmJ9JvuuABvQos1Vtp1iTjC34DWOUYAZKIYhUdPZEU7hW-TQrF20T9HIrbYgBWcrCOHGk_pb4PKHp24khKcrr63kVN6pBEBt3hYFxZEB0wLNQVTOKsZxop1mLjZKL1GGlvMftXGyBBcZZgSSQA6EHWM9d4MDPNRqMq5uffh6m8Jxq5eXPU0KUzDRx585aMXbwQ",
    cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuBd1iMeOojgKTLYtWTLWhS3dP2R1bQDMVdIXy8QVtuyV_nKwlEV1ePS4Xp86Vu5S0VJRkK9VRMK6A5vZbakIWLCkiV3_OlhuQCfpT7ABQFAMek1PoEFu81F9zkiXuQp26OUzX4DvKIB4fKpMPd0lNBtNxesRySw52jR4Qr7menbXOJ-nupzMohi1HSE2_w4UbSkeZeJD4Tlw3a5rlFj18VW8W0t1zvZa5xigDPeTgsA5GB53LtVHPLSNQ",
    tags: ["Wedding", "Engagement"],
    bio: "Hello! I'm Alisha Shrestha, a wedding and special events photographer in Chitwan. For 9 years, I've vividly captured the happy moments of weddings and engagements across Nepal."
  },
  6: {
    name: "Sameer Bajracharya",
    tagline: "Portrait and graduation photography with a personal touch",
    location: "Dharan",
    experience: "5+ Years Experience",
    shoots: "190+ Shoots",
    rating: "4.7",
    reviewCount: 61,
    price: "Rs. 15,000",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYfUIrM-nMMjDR-eNrjjG1hvZHUJfupMiqd1wudX_m54M6dICUxKA8RYVVfx7mXNg2d4gptiWWTGQpczIrCJiU9jk4C7qKhTqwG6912qpDgy9bHDKECYqZW12sdEECGQGKSJmLmmUPHHpJPKAdEiq6T8s2CrRjR8kFMm1B5t34RLiLnyteRJGXen_Z_Nd-y_wm8QJ6FucJ148s7N6VXuLXMDbMTf1_J4ZijsdW7sPBybvAcVWZJO__ZA",
    cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuDkDYIXtqRlwcOpYk1oFxM2q2Kz14E_rXpr9GkubN3afGCnTXYFntodJFlRuWxJZ80YWfOhd4eqhjsUKx2A_ybaZbmD07145lU360aWglqfws_3RQ7PekTFY8Tm2jjVFMTrslM9E57KbNQDQLzmWUmjVGg06nbHR8RnAbrz5uvGe5BBk6U5pT-liQQ48hBbbKUeyTDnwS8wiiPMfJ83TXnR_OvFBoJ2bhvgJWQMO3OKfRRAGagAiBm15g",
    tags: ["Graduation", "Portrait"],
    bio: "I'm Sameer Bajracharya, working in Dharan specializing in portraits and graduation ceremonies. For over 5 years, I've been creating personal portraits and documenting the special days of student success."
  },
  7: {
    name: "Priya Adhikari",
    tagline: "Excellent wedding and portrait photography with cultural sensitivity",
    location: "Kathmandu",
    experience: "7+ Years Experience",
    shoots: "290+ Shoots",
    rating: "4.8",
    reviewCount: 103,
    price: "Rs. 45,000",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAHPVbFE__POTa5RcH8oI51tdOZ7-KYvHZNzjgpgoWmr_i6tyqWeAlp5G9EBilDFyWgLj0MyZtDFSGea0XrH_4QaS6Uwd-yznTpMIVt2yKSp65sIrAi8RlxpPXc4JbYwTYS0bxpZTGd052YLcwrovfJM-f00f9w7C3h9PLzW4uv8qCaIEdd0T-cOf23-yBEGIMmrXEPEN1OUs0lKSZahmLjhOwlao7DxVcF4UuIr6qgIDqZiDQhkwZ57g",
    cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuCE70aL1E4i0V71dnnUpTjMrzeCl3CqrjTOBToicSxL-2EI2Nh_nXaCPB8tvTzw76fzqyAKdY7ru7-hpHcNFDDzv0qbb_UpyR4y2ZQFxP0detQX-map8iMHD7_engqpAX8KargH8f15oFSMw3KyZjxz04fJD18TTO_BB5R5CYqmH_gBlYoNRwofwr1T6WGip5YU8vRWwfbzbTC3kvS_TbaKUoGeiTl4Nj9zK6bH_L7acWpJFjn5LJrwUA",
    tags: ["Wedding", "Portrait"],
    bio: "I'm Priya Adhikari, a wedding and portrait photographer based in Kathmandu. I have a special interest in capturing local cultural rituals and emotions artistically and vividly in photos.",
  },
  8: {
    name: "Kiran Thapa",
    tagline: "Corporate and birthday events full of energy and enthusiasm",
    location: "Butwal",
    experience: "4+ Years Experience",
    shoots: "160+ Shoots",
    rating: "4.6",
    reviewCount: 47,
    price: "Rs. 18,000",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDJtarV-pgPfye5VkrbWu0jLD9exz7VKuSsYpUUfFCnuifgbOk_1gTE_bYmRczoGnBfrvCZeudh3W8lWAFFBW0tYSjS6bnvTQydWAWilQYOmmjisWz44VWPbApeLiIFwwVdJ1FoR66Q2g_aOYfrW-JgCyHS0Zo4MQzlO1nerL6wTxUqll278YMoL1ZgbZJXV4KX1QKileRat92MM4qWOVFzyP0mxC3jYeyKbepDI26nFRDryrdfz1sJEQ",
    cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuCMrWuiE-qrOGoXqLWrnjoK0hfimOMFY32g4Co1Xe_6Ss2PfweWZ39Y9CAV-dblP5IE3IBByVy3M0lD6kLzb-YPs9s25-ZuM8RqSnN4fbrdHf7tZ04lpjviwglz9B1wJmeSjRxlIqSNzsaiSQ1L0xK4PmSJ9d89CgBtyBBwI6ia6K5IVf6MfCklnbO2EPXRObejeqXzUNE5jnWKvq1B21escM1sxY8M7A1EXpPzqwb9yW5NqfehitQc9w",
    tags: ["Corporate", "Birthday"],
    bio: "I'm Kiran Thapa, working in Butwal. My goal is to make energetic and special moments like birthdays, anniversaries, and corporate gatherings everlasting through photos."
  },
  9: {
    name: "Supriya Joshi",
    tagline: "Product and fashion photography with minimal beauty",
    location: "Pokhara",
    experience: "7+ Years Experience",
    shoots: "310+ Shoots",
    rating: "4.9",
    reviewCount: 119,
    price: "Rs. 25,000",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDxgKhmVORqkgZ_Fx6Cc0BNUXEz_3u7s-iWlZZgKroQHtpT5y05G2JYUJkjDvEcYKVU70sN4h963EFW6d8Nw3UWlF6a805kirDre8gO0dCKMQy4EbWtWJu8h8o8XXcvkbdSpzbqk1Nm03McyW-EDwauYxnScLeWCa_8sXnug49YLmDAV11gUuTyfsbCD0qxYq5NZ7WLLUI5lPhuidnW0jkKimMIf1jz6_wj7aYTwsXyZIx3x-2xlt6Wdw",
    cover: "https://lh3.googleusercontent.com/aida-public/AB6AXuDqL8gnFyRzPLPMImjk5pjFFilazgF2MvZiyTqvMb6ZGimmEQLuxCohfr7haEk5CrmHV4-jjAc5o-0zpp7pqt1nxq88CwjSdWztsbNL1FpeX-UM1VRyUf3h_hnuUN3bkNj-1s1SUtPwn37_IQXZBI3TQaecrpcp-ExgPSDZ9hco27LkXL1OGgNYk7Pw9MRVxfYlbdT1ObwC4o9aOCtO7DJ5AAb30PQS6gy0Qc2fCJARyy6nJsz3FqgVkA",
    tags: ["Product", "Fashion"],
    bio: "I'm Supriya Joshi, a fashion and product photographer. I like presenting images in a simple, minimal yet meaningful way, so that the product or person themselves becomes a beautiful story."
  }
};

// Shared gallery images (realistic Unsplash-style URLs via Google hosted)
const GALLERY_IMAGES = [
  { src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWb1HFQ4gye_KvOSEQv17jMl-pl1VRCe8ZF0WG-wI-Gw9uDQ7Gv3LzW8mmy3_ygaRzIJiT-I9e72DoRHPFrd85d0rDQNxNr0A6KsdhfmucvFrDW1bEwkpBUUEmJTxzlohZGgqILKpsBCmZ0jyVLKDyGyi9beJsjkeHJX8ztkhxrLzYEAbxuuU4SkC9MQjtPC8ng2mvzaJ9yAr3npDVf_slwndjQtyS9OJhOo1_R8wyvLjGd3nJUOTULQ", tag: "wedding", tall: true },
  { src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLtjwkITVVShLLquHGczx27Fb6lnVelsacdG5i1xmjjF_ijfeSoaKmNY7anI9TyzkQQJIxqEYtnHlhKJjXwiMM0w1EOm7VjbQAZ2qioVnuzHpnkMlg69xUen5GHqhcydRvvdIawuW7LLfk97objy2Gtb82Fg1F92J9vtnPOEcY75un5EI5bVXNd_sFoCtWPtFUld9p0vLNLgELOTLfx4JpUYtaES8AquGhrdaedYTqe22AX56FZ5ROvg", tag: "portrait" },
  { src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAXRmI5UgMzQ2qmvBW2WtXqpH_GPGuoCUHAHYT-pGxRdQWKnqgbUg8nnII2ZakVSwR3Zk_0M2VodgiwZlYuQPgF8KAfMhI1uC92HCNRsDLvW1GRYvgFNt_nvKGlEwtqtz6UOgDJi8uD26indgvzk4EdpPzoCu3ZDbaR340VEhf8oBlMhdztqocWc3eutVm1WZonzk4vUKWLOoOdChAgqOXtwMietssCykkPx1AUllfMlCg7ID68P1jIBg", tag: "family" },
  { src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUgRQFXyY3teHI5iFwR1eMfMl1fveUDVWNslurAwd2FnncwOBcJPemPr7C5BhSMm3n2BUu7Vp-9VxV92kdgU0gFlWibj5Qrddjth-PAXek2bPOCoJ-mKKXa-hwqs2t4Wh_WVKWOkB-CDS3s1ydn59yBVCGgpOzwax6EailPkWctfdNrjPi33BC3KzPcMv3evFeGirAqAArnkJtLoV84H2xl6Nz7Qqa5_t__IY-FaYqlT9H8tvUx06tDA", tag: "corporate" },
  { src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBd1iMeOojgKTLYtWTLWhS3dP2R1bQDMVdIXy8QVtuyV_nKwlEV1ePS4Xp86Vu5S0VJRkK9VRMK6A5vZbakIWLCkiV3_OlhuQCfpT7ABQFAMek1PoEFu81F9zkiXuQp26OUzX4DvKIB4fKpMPd0lNBtNxesRySw52jR4Qr7menbXOJ-nupzMohi1HSE2_w4UbSkeZeJD4Tlw3a5rlFj18VW8W0t1zvZa5xigDPeTgsA5GB53LtVHPLSNQ", tag: "wedding" },
  { src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDkDYIXtqRlwcOpYk1oFxM2q2Kz14E_rXpr9GkubN3afGCnTXYFntodJFlRuWxJZ80YWfOhd4eqhjsUKx2A_ybaZbmD07145lU360aWglqfws_3RQ7PekTFY8Tm2jjVFMTrslM9E57KbNQDQLzmWUmjVGg06nbHR8RnAbrz5uvGe5BBk6U5pT-liQQ48hBbbKUeyTDnwS8wiiPMfJ83TXnR_OvFBoJ2bhvgJWQMO3OKfRRAGagAiBm15g", tag: "portrait", tall: true },
  { src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCE70aL1E4i0V71dnnUpTjMrzeCl3CqrjTOBToicSxL-2EI2Nh_nXaCPB8tvTzw76fzqyAKdY7ru7-hpHcNFDDzv0qbb_UpyR4y2ZQFxP0detQX-map8iMHD7_engqpAX8KargH8f15oFSMw3KyZjxz04fJD18TTO_BB5R5CYqmH_gBlYoNRwofwr1T6WGip5YU8vRWwfbzbTC3kvS_TbaKUoGeiTl4Nj9zK6bH_L7acWpJFjn5LJrwUA", tag: "wedding" },
  { src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCMrWuiE-qrOGoXqLWrnjoK0hfimOMFY32g4Co1Xe_6Ss2PfweWZ39Y9CAV-dblP5IE3IBByVy3M0lD6kLzb-YPs9s25-ZuM8RqSnN4fbrdHf7tZ04lpjviwglz9B1wJmeSjRxlIqSNzsaiSQ1L0xK4PmSJ9d89CgBtyBBwI6ia6K5IVf6MfCklnbO2EPXRObejeqXzUNE5jnWKvq1B21escM1sxY8M7A1EXpPzqwb9yW5NqfehitQc9w", tag: "corporate" },
  { src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDqL8gnFyRzPLPMImjk5pjFFilazgF2MvZiyTqvMb6ZGimmEQLuxCohfr7haEk5CrmHV4-jjAc5o-0zpp7pqt1nxq88CwjSdWztsbNL1FpeX-UM1VRyUf3h_hnuUN3bkNj-1s1SUtPwn37_IQXZBI3TQaecrpcp-ExgPSDZ9hco27LkXL1OGgNYk7Pw9MRVxfYlbdT1ObwC4o9aOCtO7DJ5AAb30PQS6gy0Qc2fCJARyy6nJsz3FqgVkA", tag: "portrait" },
];

const SAMPLE_REVIEWS = [
  {
    name: "Ram & Sita Shah",
    event: "Wedding — December 2025",
    rating: 5,
    date: "December 22, 2025",
    body: "We couldn't have asked for a better photographer for our wedding day. Every moment was captured with genuine emotion and exceptional artistry. Our entire family was moved to tears looking through the gallery!",
  },
  {
    name: "Rajesh Karki",
    event: "Corporate Headshots — April 2025",
    rating: 5,
    date: "April 14, 2025",
    body: "Booked headshots for our 12-person leadership team, and the entire experience was outstanding. Everyone felt natural and relaxed in front of the lens. Delivery was prompt and truly professional.",
  },
  {
    name: "Maya Gurung",
    event: "Portrait Session — February 2025",
    rating: 5,
    date: "February 10, 2025",
    body: "I was initially quite nervous about having portraits taken, but the photographer made me feel right at home immediately. The mountain backdrop shots turned out more breathtaking than I could have imagined!",
  },
  {
    name: "Kiran & Pooja Shrestha",
    event: "Engagement — January 2025",
    rating: 4,
    date: "January 22, 2025",
    body: "Our engagement photos near Phewa Lake turned out like a dream. The choice of angles and natural light was magnificent. We had to reschedule once due to rain and she was incredibly accommodating. Highly recommended!",
  },
];

// ============================================
// INIT
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id")) || 1;
  const data = PHOTOGRAPHERS[id] || PHOTOGRAPHERS[1];

  loadProfileData(data);
  renderGallery(GALLERY_IMAGES);
  renderReviews(SAMPLE_REVIEWS.slice(0, 3));
  initTabs();
  initGalleryFilter();
  initLightbox();
  initBookingModal(data);
  initPackageButtons();
  initFAQ();
  initSaveButton();
});

// ============================================
// 1. PROFILE DATA
// ============================================
function loadProfileData(data) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const setSrc = (id, val) => { const el = document.getElementById(id); if (el) el.src = val; };

  set("profName", data.name);
  set("profTagline", data.tagline);
  set("profLocation", data.location);
  set("profExp", data.experience);
  set("profShootsCount", data.shoots);
  set("profRating", data.rating);
  set("profReviewCount", data.reviewCount);
  set("profPrice", data.price);
  set("breadcrumbName", data.name);
  set("bookingName", data.name);

  setSrc("profAvatar", data.avatar);
  setSrc("bookingAvatar", data.avatar);

  document.title = `${data.name} — ECO SNAP Photographer`;

  // Cover image
  const cover = document.getElementById("profHeroCover");
  if (cover) cover.style.backgroundImage = `url('${data.cover}')`;

  // Tags
  const tagsEl = document.getElementById("profTags");
  if (tagsEl) {
    tagsEl.innerHTML = data.tags.map(t => `<span>${t}</span>`).join("");
  }

  // About Title & Biography (Dynamic)
  set("aboutTitle", `About ${data.name}`);
  const bioEl = document.getElementById("aboutBio");
  if (bioEl && data.bio) {
    bioEl.innerHTML = `<p>${data.bio}</p>`;
  }
}

// ============================================
// 2. GALLERY
// ============================================
function renderGallery(images) {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;

  grid.innerHTML = images.map((img, i) => `
    <div class="gallery-item${img.tall ? " tall" : ""}" data-tag="${img.tag}" data-index="${i}">
      <img src="${img.src}" alt="${img.tag} photo ${i + 1}" loading="lazy" />
      <div class="gallery-item-overlay">
        <span class="gallery-item-tag">${img.tag}</span>
      </div>
      <div class="gallery-item-zoom"><i class="ri-zoom-in-line"></i></div>
    </div>
  `).join("");
}

// ============================================
// 3. GALLERY FILTER
// ============================================
function initGalleryFilter() {
  const filterBtns = document.querySelectorAll(".gf-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.dataset.filter;

      document.querySelectorAll(".gallery-item").forEach(item => {
        const show = filter === "all" || item.dataset.tag === filter;
        item.style.display = show ? "" : "none";
      });
    });
  });

  // Load more (no-op for demo)
  const btnMore = document.getElementById("btnLoadMore");
  if (btnMore) {
    btnMore.addEventListener("click", () => {
      btnMore.textContent = "All photos loaded";
      btnMore.disabled = true;
    });
  }
}

// ============================================
// 4. LIGHTBOX
// ============================================
let lightboxImages = [];
let lightboxIndex = 0;

function initLightbox() {
  const overlay = document.getElementById("lightboxOverlay");
  const img = document.getElementById("lightboxImg");
  const counter = document.getElementById("lightboxCounter");
  const btnClose = document.getElementById("lightboxClose");
  const btnPrev = document.getElementById("lightboxPrev");
  const btnNext = document.getElementById("lightboxNext");

  if (!overlay) return;

  // Open on gallery item click
  document.getElementById("galleryGrid").addEventListener("click", e => {
    const item = e.target.closest(".gallery-item");
    if (!item) return;

    lightboxImages = [...document.querySelectorAll(".gallery-item:not([style*='none'])")]
      .map(el => el.querySelector("img").src);
    lightboxIndex = [...document.querySelectorAll(".gallery-item:not([style*='none'])")].indexOf(item);

    showLightbox();
  });

  function showLightbox() {
    img.src = lightboxImages[lightboxIndex];
    counter.textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`;
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  btnClose.addEventListener("click", closeLightbox);
  overlay.addEventListener("click", e => { if (e.target === overlay) closeLightbox(); });

  btnPrev.addEventListener("click", () => {
    lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
    showLightbox();
  });

  btnNext.addEventListener("click", () => {
    lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
    showLightbox();
  });

  document.addEventListener("keydown", e => {
    if (!overlay.classList.contains("active")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") { lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length; showLightbox(); }
    if (e.key === "ArrowRight") { lightboxIndex = (lightboxIndex + 1) % lightboxImages.length; showLightbox(); }
  });
}

// ============================================
// 5. STICKY TABS
// ============================================
function initTabs() {
  const tabs = document.querySelectorAll(".prof-tab");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => { t.classList.remove("active"); t.setAttribute("aria-selected", "false"); });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");

      const targetId = tab.dataset.target;
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Update active tab on scroll
  const sections = document.querySelectorAll(".prof-section");
  const tabsBar = document.getElementById("profTabsBar");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        tabs.forEach(t => {
          const active = t.dataset.target === id;
          t.classList.toggle("active", active);
          t.setAttribute("aria-selected", active ? "true" : "false");
        });
      }
    });
  }, { rootMargin: "-30% 0px -60% 0px" });

  sections.forEach(s => observer.observe(s));
}

// ============================================
// 6. BOOKING MODAL
// ============================================
function initBookingModal(data) {
  const overlay      = document.getElementById("bookingOverlay");
  const bookingForm  = document.getElementById("bookingForm");
  const availForm    = document.getElementById("availabilityForm");
  const availResult  = document.getElementById("availResult");
  const success      = document.getElementById("bookingSuccess");
  const btnClose     = document.getElementById("bookingClose");
  const btnCloseSuccess = document.getElementById("btnCloseSuccess");
  const titleEl      = document.getElementById("bookingTitle");

  // Track which mode the modal was opened in
  let openMode = "booking"; // "booking" | "availability"

  function setMode(mode) {
    openMode = mode;
    if (mode === "availability") {
      titleEl && (titleEl.textContent = "Check Availability");
      if (bookingForm) bookingForm.hidden = true;
      if (availForm)   { availForm.hidden = false; availForm.style.display = ""; }
      if (success)     success.hidden = true;
      // Reset availability form state
      if (availForm)   availForm.reset();
      if (availResult) { availResult.hidden = true; availResult.textContent = ""; availResult.className = "avail-result"; }
      // Enforce future dates in the native date picker
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const minDate = tomorrow.toISOString().split("T")[0];
      const dateInput = document.getElementById("availDate");
      if (dateInput) dateInput.min = minDate;
    } else {
      titleEl && (titleEl.textContent = "Book a Session");
      if (availForm)   availForm.hidden = true;
      if (bookingForm) { bookingForm.hidden = false; bookingForm.style.display = ""; }
      if (success)     success.hidden = true;
    }
  }

  function openModal(mode, preselect) {
    if (!overlay) return;
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
    setMode(mode || "booking");
    if (preselect) {
      const sel = document.getElementById("bkgPackage");
      if (sel) sel.value = preselect;
    }
  }

  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove("active");
    document.body.style.overflow = "";
    // Reset to clean booking state for next open
    if (bookingForm) { bookingForm.hidden = false; bookingForm.style.display = ""; }
    if (availForm)   availForm.hidden = true;
    if (success)     success.hidden = true;
    if (availResult) { availResult.hidden = true; availResult.textContent = ""; availResult.className = "avail-result"; }
  }

  // Booking openers
  document.getElementById("btnBookNow")?.addEventListener("click", () => openModal("booking"));
  document.getElementById("btnMessage")?.addEventListener("click", () => openModal("booking"));

  // Availability opener — swaps to availability mode
  document.getElementById("btnCheckAvail")?.addEventListener("click", () => openModal("availability"));

  btnClose?.addEventListener("click", closeModal);
  overlay?.addEventListener("click", e => { if (e.target === overlay) closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

  btnCloseSuccess?.addEventListener("click", () => {
    closeModal();
    bookingForm.style.display = "";
    success.hidden = true;
    bookingForm.reset();
    const btn = document.getElementById("btnSubmitBooking");
    if (btn) {
      btn.innerHTML = '<i class="ri-send-plane-fill"></i> Send Booking Request';
      btn.disabled = false;
    }
  });

  // ── Booking form submit ──────────────────────────────
  bookingForm?.addEventListener("submit", e => {
    e.preventDefault();
    let valid = true;

    ["bkgName", "bkgEmail", "bkgDate", "bkgPackage"].forEach(id => {
      const field = document.getElementById(id);
      if (field && !field.value.trim()) {
        field.classList.add("error");
        valid = false;
        field.addEventListener("input", () => field.classList.remove("error"), { once: true });
      }
    });

    if (!valid) return;

    const btn = document.getElementById("btnSubmitBooking");
    if (btn) {
      btn.innerHTML = '<i class="ri-loader-4-line spin"></i> Sending...';
      btn.disabled = true;
    }

    setTimeout(() => {
      bookingForm.style.display = "none";
      success.hidden = false;
      if (btn) {
        btn.innerHTML = '<i class="ri-send-plane-fill"></i> Send Booking Request';
        btn.disabled = false;
      }
    }, 1000);
  });

  // ── Availability form submit ─────────────────────────
  availForm?.addEventListener("submit", e => {
    e.preventDefault();

    const dateInput = document.getElementById("availDate");
    const slotInput = document.getElementById("availTimeSlot");
    const submitBtn = document.getElementById("btnCheckAvailSubmit");

    // Validate: date required and must be in the future
    const selectedDate = dateInput?.value;
    if (!selectedDate) {
      dateInput?.classList.add("error");
      dateInput?.addEventListener("input", () => dateInput.classList.remove("error"), { once: true });
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosen = new Date(selectedDate);
    if (chosen <= today) {
      dateInput.classList.add("error");
      showAvailResult(false, '<i class="ri-error-warning-fill"></i> <span>Please select a future date.</span>');
      return;
    }

    // Loading state
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="ri-loader-4-line spin"></i> Checking...';
      submitBtn.disabled = true;
    }

    // Simulate async availability check (deterministic mock)
    setTimeout(() => {
      const slot = slotInput?.value || "MORNING";
      const dayOfWeek = chosen.getDay(); // 0 = Sun, 6 = Sat
      // Mock logic: weekends FULL_DAY unavailable; Mondays MORNING unavailable
      let available;
      if (slot === "FULL_DAY" && (dayOfWeek === 0 || dayOfWeek === 6)) {
        available = false;
      } else if (slot === "MORNING" && dayOfWeek === 1) {
        available = false;
      } else {
        available = true;
      }

      const slotLabel = { MORNING: "Morning", AFTERNOON: "Afternoon", EVENING: "Evening", FULL_DAY: "Full Day" }[slot] || slot;
      const dateStr   = chosen.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

      if (available) {
        showAvailResult(true, `<i class="ri-checkbox-circle-fill"></i> <span><strong>${slotLabel}</strong> on ${dateStr} is <strong>available</strong>!</span>`);
      } else {
        showAvailResult(false, `<i class="ri-close-circle-fill"></i> <span><strong>${slotLabel}</strong> on ${dateStr} is <strong>unavailable</strong>. Please try another date or time slot.</span>`);
      }

      if (submitBtn) {
        submitBtn.innerHTML = '<i class="ri-calendar-check-line"></i> Check Availability';
        submitBtn.disabled = false;
      }
    }, 800);
  });

  function showAvailResult(isAvailable, html) {
    if (!availResult) return;
    if (!html.includes("<span") && html.includes("</i>")) {
      const parts = html.split("</i>");
      html = parts[0] + "</i> <span>" + parts.slice(1).join("</i>").trim() + "</span>";
    } else if (!html.includes("<i") && !html.includes("<span")) {
      html = `<span>${html}</span>`;
    }
    availResult.innerHTML = html;
    availResult.className = "avail-result " + (isAvailable ? "avail-result--available" : "avail-result--unavailable");
    availResult.hidden = false;
  }
}

// ============================================
// 7. PACKAGE BUTTONS
// ============================================
function initPackageButtons() {
  const pkgMap = {
    "btnSelectEssential": "essential",
    "btnSelectPremium": "premium",
    "btnSelectElite": "elite",
  };

  Object.entries(pkgMap).forEach(([btnId, pkg]) => {
    document.getElementById(btnId)?.addEventListener("click", () => {
      const overlay = document.getElementById("bookingOverlay");
      const bookingTitle = document.getElementById("bookingTitle");
      const bookingForm  = document.getElementById("bookingForm");
      const availForm    = document.getElementById("availabilityForm");
      const availResult  = document.getElementById("availResult");
      const success      = document.getElementById("bookingSuccess");
      if (overlay) {
        overlay.classList.add("active");
        document.body.style.overflow = "hidden";
        // Ensure booking mode
        if (bookingTitle) bookingTitle.textContent = "Book a Session";
        if (availForm) availForm.hidden = true;
        if (bookingForm) { bookingForm.hidden = false; bookingForm.style.display = ""; }
        if (success) success.hidden = true;
        if (availResult) { availResult.hidden = true; availResult.className = "avail-result"; }
        const sel = document.getElementById("bkgPackage");
        if (sel) sel.value = pkg;
      }
    });
  });
}

// ============================================
// 8. REVIEWS
// ============================================
function renderReviews(reviews) {
  const list = document.getElementById("reviewsList");
  if (!list) return;

  list.innerHTML = reviews.map(r => {
    const initials = r.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const stars = Array(r.rating).fill('<i class="ri-star-fill"></i>').join("");
    return `
      <div class="review-card">
        <div class="review-header">
          <div class="review-user">
            <div class="review-avatar-initials">${initials}</div>
            <div>
              <div class="review-user-name">${r.name}</div>
              <div class="review-user-event">${r.event}</div>
            </div>
          </div>
          <div class="review-meta">
            <div class="review-stars">${stars}</div>
            <div class="review-date">${r.date}</div>
          </div>
        </div>
        <p class="review-body">${r.body}</p>
      </div>
    `;
  }).join("");

  const btnMore = document.getElementById("btnLoadMoreReviews");
  if (btnMore) {
    btnMore.addEventListener("click", () => {
      renderReviews(SAMPLE_REVIEWS);
      btnMore.style.display = "none";
    });
  }
}

// ============================================
// 9. FAQ ACCORDION
// ============================================
function initFAQ() {
  document.querySelectorAll(".faq-question").forEach(btn => {
    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      const answer = btn.nextElementSibling;

      // Close all
      document.querySelectorAll(".faq-question").forEach(b => {
        b.setAttribute("aria-expanded", "false");
        b.nextElementSibling?.classList.remove("open");
      });

      if (!isOpen) {
        btn.setAttribute("aria-expanded", "true");
        answer?.classList.add("open");
      }
    });
  });
}

// ============================================
// 10. SAVE BUTTON TOGGLE
// ============================================
function initSaveButton() {
  const btn = document.getElementById("btnSave");
  if (!btn) return;
  btn.addEventListener("click", () => {
    btn.classList.toggle("saved");
    const icon = btn.querySelector("i");
    if (icon) {
      icon.className = btn.classList.contains("saved") ? "ri-heart-fill" : "ri-heart-line";
    }
  });
}
