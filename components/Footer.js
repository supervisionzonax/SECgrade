export default function Footer() {
	return (
		<footer className="footer">
			<div className="footer-container">
				<div className="footer-section footer-info">
					<div className="footer-logo-wrapper">
						<div className="footer-logo">
							<img
								src="/logo-sonora.png"
								alt="Gobierno de Sonora"
								onError={(e) => {
									e.target.style.display = "none";
									e.target.nextElementSibling.style.display = "flex";
								}}
							/>
							<div className="footer-logo-fallback">
								GOB
								<br />
								SON
							</div>
						</div>
					</div>
					<h4>Secretaría de Educación y Cultura</h4>
					<p>Gobierno del Estado de Sonora</p>
					<p className="footer-program">
						Programa Recuperando Aprendizajes Fundamentales
					</p>
				</div>

				<div className="footer-section footer-contact">
					<h3>Contacto</h3>
					<div className="footer-contact-item">
						<i className="fas fa-map-marker-alt"></i>
						<span>Blvd. Colosio s/n, Hermosillo, Sonora</span>
					</div>
					<div className="footer-contact-item">
						<i className="fas fa-phone"></i>
						<span>(662) 350 1632</span>
					</div>
					<div className="footer-contact-item">
						<i className="fas fa-envelope"></i>
						<span>asilvasm97@gmail.com</span>
					</div>
				</div>
			</div>

			<div className="copyright">
				<p>
					&copy; 2025 Gobierno del Estado de Sonora. Todos los derechos
					reservados.
				</p>
			</div>
		</footer>
	);
}
