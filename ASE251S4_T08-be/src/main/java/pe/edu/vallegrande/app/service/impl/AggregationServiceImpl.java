package pe.edu.vallegrande.app.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.app.service.AggregationService;
import reactor.core.publisher.Flux;

import java.util.Map;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;

@Service
public class AggregationServiceImpl implements AggregationService {

    @Autowired
    private ReactiveMongoTemplate reactiveMongoTemplate;

    // =========================================================================
    // PIPELINE 1 — Product summary by category
    // Collection: products
    // Groups by "category" and calculates total products,
    // average price (converting Decimal128 to Double) and accumulated stock.
    // =========================================================================
    @Override
    public Flux<Map<String, Object>> productosResumenPorCategoria() {

        // $group stage
        AggregationOperation groupStage = group("category")
                .count().as("totalProducts")
                .sum("currentStock").as("totalStock")
                // $toDouble needed because unitPrice is stored as Decimal128
                .avg(context -> new org.bson.Document("$avg",
                        new org.bson.Document("$toDouble", "$unitPrice")))
                .as("averagePrice");

        // $project stage: rename _id to "category" and round the price
        AggregationOperation projectStage = project()
                .andExclude("_id")
                .and("_id").as("category")
                .andInclude("totalProducts", "totalStock")
                .and(context -> new org.bson.Document("$round",
                        java.util.List.of("$averagePrice", 2)))
                .as("averagePrice");

        // $sort stage: highest stock first
        AggregationOperation sortStage = sort(
                org.springframework.data.domain.Sort.by(
                        org.springframework.data.domain.Sort.Direction.DESC, "totalStock"));

        Aggregation aggregation = newAggregation(groupStage, projectStage, sortStage);

        @SuppressWarnings("unchecked")
        Flux<Map<String, Object>> result = (Flux<Map<String, Object>>) (Flux<?>) 
            reactiveMongoTemplate.aggregate(aggregation, "products", Map.class);
        return result;
    }

    // =========================================================================
    // PIPELINE 2 — Ranking of active agrochemical manufacturers
    // Collection: agrochemicals
    // Filters active, groups by manufacturer, shows handled categories
    // and average waiting days (SENASA).
    // =========================================================================
    @Override
    public Flux<Map<String, Object>> agroquimicosPorFabricante() {

        // $match stage: only active agrochemicals
        AggregationOperation matchStage = match(Criteria.where("active").is(true));

        // $group stage: group by manufacturer
        AggregationOperation groupStage = group("manufacturer")
                .count().as("totalProducts")
                .addToSet("category").as("categories")
                .avg("waitingPeriodDays").as("averageWaitingDays");

        // $project stage: rename _id to "manufacturer" and round waiting days
        AggregationOperation projectStage = project()
                .andExclude("_id")
                .and("_id").as("manufacturer")
                .andInclude("totalProducts", "categories")
                .and(context -> new org.bson.Document("$round",
                        java.util.List.of("$averageWaitingDays", 1)))
                .as("averageWaitingDays");

        // $sort stage: highest product count first (ranking)
        AggregationOperation sortStage = sort(
                org.springframework.data.domain.Sort.by(
                        org.springframework.data.domain.Sort.Direction.DESC, "totalProducts"));

        Aggregation aggregation = newAggregation(matchStage, groupStage, projectStage, sortStage);

        @SuppressWarnings("unchecked")
        Flux<Map<String, Object>> result = (Flux<Map<String, Object>>) (Flux<?>) 
            reactiveMongoTemplate.aggregate(aggregation, "agrochemicals", Map.class);
        return result;
    }
}