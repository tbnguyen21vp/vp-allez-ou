// Accordion
const accordionItems = document.querySelectorAll('.accordion-item');
let activeAccordion = null;

accordionItems.forEach(accordionItem => {
  const accordionButton = accordionItem.querySelector('.accordion-button');
  const accordionCollapsed = accordionButton.classList.contains('collapsed');
  
  if (!accordionCollapsed) {
    accordionItem.style.borderLeft = '0.35rem solid #F14868';
    accordionItem.classList.add('hide-before'); // Thêm lớp 'hide-before' vào accordion-item
  }

  accordionButton.addEventListener('click', () => {
    if (activeAccordion === accordionItem) {
      // Nếu đã click vào accordion-button trước đó
      accordionItem.style.borderLeft = 'none';
      accordionItem.classList.remove('hide-before'); // Xóa lớp 'hide-before' khỏi accordion-item
      activeAccordion = null; // Xóa trạng thái active
    } else {
      // Nếu click vào accordion-button mới
      if (activeAccordion) {
        // Nếu đã có accordion-button được click trước đó
        activeAccordion.style.borderLeft = 'none';
        activeAccordion.classList.remove('hide-before'); // Xóa lớp 'hide-before' khỏi accordion-item
      }
      accordionItem.style.borderLeft = '0.35rem solid #F14868';
      accordionItem.classList.add('hide-before'); // Thêm lớp 'hide-before' vào accordion-item
      activeAccordion = accordionItem; // Gán trạng thái active
    }
  });
});
