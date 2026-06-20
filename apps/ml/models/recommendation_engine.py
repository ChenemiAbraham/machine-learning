"""
Product Recommendation Engine

Recommends products/features to users based on:
- Collaborative filtering (users with similar behavior)
- Content-based filtering (user's historical preferences)
- Hybrid approach combining both
"""

import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Tuple
import psycopg2


class ProductRecommender:
    """Hybrid recommendation system"""

    def __init__(self):
        self.user_item_matrix = None
        self.item_features = None
        self.user_similarity_matrix = None
        self.item_similarity_matrix = None

    def prepare_data(self, conn_string: str) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Prepare user-item interaction matrix

        Items: transaction types (send, receive, conversion, withdrawal, deposit)
        """
        conn = psycopg2.connect(conn_string)

        # Get user-item interactions
        query = """
        SELECT
            user_id,
            type AS product,
            COUNT(*) AS interaction_count,
            SUM(amount) AS total_amount,
            AVG(amount) AS avg_amount
        FROM transactions
        WHERE status = 'completed'
        GROUP BY user_id, type
        """

        interactions = pd.read_sql_query(query, conn)

        # Get user features
        user_query = """
        SELECT
            user_id,
            kyc_status,
            country_code,
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) / 86400 AS days_since_signup
        FROM users
        WHERE deleted_at IS NULL
        """

        user_features = pd.read_sql_query(user_query, conn)
        conn.close()

        return interactions, user_features

    def build_user_item_matrix(self, interactions: pd.DataFrame) -> pd.DataFrame:
        """
        Build user-item interaction matrix

        Rows: users
        Columns: products (transaction types)
        Values: interaction count
        """
        matrix = interactions.pivot_table(
            index='user_id',
            columns='product',
            values='interaction_count',
            fill_value=0
        )

        self.user_item_matrix = matrix
        return matrix

    def compute_collaborative_filtering(self):
        """
        Compute user-user similarity for collaborative filtering

        Users with similar transaction patterns get similar recommendations
        """
        if self.user_item_matrix is None:
            raise ValueError("User-item matrix not built. Call build_user_item_matrix first.")

        # Compute cosine similarity between users
        self.user_similarity_matrix = cosine_similarity(self.user_item_matrix)

        print(f"✓ User similarity matrix computed: {self.user_similarity_matrix.shape}")

    def compute_content_based(self):
        """
        Compute item-item similarity for content-based filtering

        Products with similar usage patterns are similar
        """
        if self.user_item_matrix is None:
            raise ValueError("User-item matrix not built")

        # Transpose to get item-user matrix
        item_user_matrix = self.user_item_matrix.T

        # Compute cosine similarity between items
        self.item_similarity_matrix = cosine_similarity(item_user_matrix)

        print(f"✓ Item similarity matrix computed: {self.item_similarity_matrix.shape}")

    def recommend_collaborative(
        self, user_id: str, top_n: int = 3
    ) -> List[Dict[str, any]]:
        """
        Recommend products based on similar users

        Args:
            user_id: Target user
            top_n: Number of recommendations

        Returns:
            List of product recommendations with scores
        """
        if user_id not in self.user_item_matrix.index:
            return []

        user_idx = self.user_item_matrix.index.get_loc(user_id)

        # Get similar users (excluding self)
        similarities = self.user_similarity_matrix[user_idx]
        similar_users_idx = np.argsort(similarities)[::-1][1:11]  # Top 10 similar users

        # Get products used by similar users but not by target user
        target_products = self.user_item_matrix.iloc[user_idx]
        similar_users_products = self.user_item_matrix.iloc[similar_users_idx]

        # Weight by similarity
        weights = similarities[similar_users_idx]
        weighted_scores = similar_users_products.T.dot(weights)

        # Filter out products already used by target user
        unused_products = target_products == 0
        recommendations = weighted_scores[unused_products].sort_values(ascending=False)

        results = []
        for product, score in recommendations.head(top_n).items():
            results.append({
                'product': product,
                'score': float(score),
                'reason': 'Users similar to you also used this',
            })

        return results

    def recommend_content_based(
        self, user_id: str, top_n: int = 3
    ) -> List[Dict[str, any]]:
        """
        Recommend products similar to what user already uses

        Args:
            user_id: Target user
            top_n: Number of recommendations

        Returns:
            List of product recommendations with scores
        """
        if user_id not in self.user_item_matrix.index:
            return []

        user_products = self.user_item_matrix.loc[user_id]
        used_products = user_products[user_products > 0]

        if len(used_products) == 0:
            return []

        # Get products similar to used products
        product_list = list(self.user_item_matrix.columns)
        scores = {}

        for used_product in used_products.index:
            used_idx = product_list.index(used_product)
            similarities = self.item_similarity_matrix[used_idx]

            for i, sim in enumerate(similarities):
                product = product_list[i]
                if product != used_product and user_products[product] == 0:
                    scores[product] = max(scores.get(product, 0), sim)

        # Sort by score
        sorted_products = sorted(scores.items(), key=lambda x: x[1], reverse=True)

        results = []
        for product, score in sorted_products[:top_n]:
            results.append({
                'product': product,
                'score': float(score),
                'reason': f'Similar to {", ".join(used_products.index[:2].tolist())}',
            })

        return results

    def recommend_hybrid(
        self, user_id: str, top_n: int = 3, alpha: float = 0.5
    ) -> List[Dict[str, any]]:
        """
        Hybrid recommendations combining collaborative and content-based

        Args:
            user_id: Target user
            top_n: Number of recommendations
            alpha: Weight for collaborative (1-alpha for content-based)

        Returns:
            Combined recommendations
        """
        collab_recs = self.recommend_collaborative(user_id, top_n=10)
        content_recs = self.recommend_content_based(user_id, top_n=10)

        # Combine scores
        combined = {}

        for rec in collab_recs:
            product = rec['product']
            combined[product] = {
                'score': alpha * rec['score'],
                'reason': rec['reason'],
            }

        for rec in content_recs:
            product = rec['product']
            if product in combined:
                combined[product]['score'] += (1 - alpha) * rec['score']
                combined[product]['reason'] += f" & {rec['reason']}"
            else:
                combined[product] = {
                    'score': (1 - alpha) * rec['score'],
                    'reason': rec['reason'],
                }

        # Sort by combined score
        sorted_products = sorted(
            combined.items(),
            key=lambda x: x[1]['score'],
            reverse=True
        )

        results = []
        for product, data in sorted_products[:top_n]:
            results.append({
                'product': product,
                'score': float(data['score']),
                'reason': data['reason'],
                'method': 'hybrid',
            })

        return results

    def get_popular_products(self, top_n: int = 3) -> List[Dict[str, any]]:
        """
        Get most popular products (fallback for cold start)

        Returns:
            List of popular products
        """
        if self.user_item_matrix is None:
            return []

        product_popularity = self.user_item_matrix.sum(axis=0).sort_values(ascending=False)

        results = []
        for product, count in product_popularity.head(top_n).items():
            results.append({
                'product': product,
                'score': float(count),
                'reason': 'Popular among all users',
                'method': 'popularity',
            })

        return results

    def train(self, conn_string: str):
        """Train recommendation engine"""
        print("Training recommendation engine...\n")

        interactions, user_features = self.prepare_data(conn_string)
        print(f"Loaded {len(interactions)} interactions for {interactions['user_id'].nunique()} users")

        self.build_user_item_matrix(interactions)
        print(f"User-item matrix: {self.user_item_matrix.shape}\n")

        self.compute_collaborative_filtering()
        self.compute_content_based()

        print("\n✓ Recommendation engine ready!")


def main():
    """Train recommendation engine"""
    recommender = ProductRecommender()

    conn_string = "host=localhost port=54322 dbname=postgres user=postgres password=postgres"

    recommender.train(conn_string)

    # Test recommendations
    if len(recommender.user_item_matrix) > 0:
        test_user = recommender.user_item_matrix.index[0]
        print(f"\n\nTest recommendations for user {test_user}:")

        print("\nCollaborative filtering:")
        collab = recommender.recommend_collaborative(test_user)
        for rec in collab:
            print(f"  - {rec['product']}: {rec['score']:.3f} ({rec['reason']})")

        print("\nContent-based:")
        content = recommender.recommend_content_based(test_user)
        for rec in content:
            print(f"  - {rec['product']}: {rec['score']:.3f} ({rec['reason']})")

        print("\nHybrid:")
        hybrid = recommender.recommend_hybrid(test_user)
        for rec in hybrid:
            print(f"  - {rec['product']}: {rec['score']:.3f} ({rec['reason']})")


if __name__ == '__main__':
    main()
